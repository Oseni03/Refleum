import { NextRequest, after } from "next/server";
import { recordUsage } from "@/server/subscription";
import {
	listResumes,
	createResumeRecord,
	updateResumeRecord,
} from "@/server/resumes";
import {
	extractTextFromDocument,
	parseResumeToJson,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@/lib/parser";
import { ResumeStatus } from "@prisma/client";
import {
	authenticate,
	parsePagination,
	apiOk,
	apiCreated,
	apiError,
} from "@/lib/api";

// GET /api/v1/resumes — list resumes (org-scoped, paginated)
// ?include_master=true  → include master resume in results (default false, FR-091)
export async function GET(req: NextRequest) {
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	const { limit, offset } = parsePagination(req);
	const includeMaster =
		new URL(req.url).searchParams.get("include_master") === "true";

	const result = await listResumes(organizationId, includeMaster, {
		limit,
		offset,
	});
	if (!result.success) return apiError(result.error, 500);

	return apiOk(result.data);
}

export async function POST(req: NextRequest) {
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return apiError(
				"VALIDATION_ERROR",
				422,
				"Missing 'file' in form data",
			);
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			return apiError(
				"PAYLOAD_TOO_LARGE",
				413,
				"File size exceeds the 10 MB limit",
			);
		}

		if (!isAllowedMimeType(file.type)) {
			return apiError(
				"VALIDATION_ERROR",
				422,
				"Only PDF and DOCX files are accepted",
			);
		}

		const setAsMaster = formData.get("set_as_master");
		const explicitMaster =
			setAsMaster === "true"
				? true
				: setAsMaster === "false"
					? false
					: undefined;

		const buffer = Buffer.from(await file.arrayBuffer());

		// Phase 1: Fast Text Extraction (Synchronous)
		const extractResult = await extractTextFromDocument(buffer, file.name);

		if (!extractResult.success) {
			return apiError(extractResult.error, 422);
		}

		const { markdown, html } = extractResult.data;

		// Create record as PROCESSING
		const saveResult = await createResumeRecord({
			organizationId,
			markdown,
			html,
			structuredData: {},
			filename: file.name,
			status: ResumeStatus.PROCESSING,
			isMaster: explicitMaster,
		});

		if (!saveResult.success) {
			return apiError(saveResult.error, 500);
		}

		const resume = saveResult.data;

		// Phase 2: Heavy LLM Parsing (Asynchronous)
		after(async () => {
			try {
				const structuredData = await parseResumeToJson(
					organizationId,
					markdown,
				);
				await updateResumeRecord(resume.id, organizationId, {
					structuredData: structuredData as any,
					status: ResumeStatus.READY,
				});

				// Record usage only after successful parse
				await recordUsage(organizationId, "parse", resume.id);
			} catch (err: any) {
				console.error(`Background parse failed for ${resume.id}:`, err);
				await updateResumeRecord(resume.id, organizationId, {
					status: ResumeStatus.FAILED,
				});
			}
		});

		return apiCreated({
			resume_id: resume.id,
			is_master: resume.isMaster,
			status: resume.status,
			filename: resume.filename,
			warnings: [],
		});
	} catch (e: any) {
		return apiError("INTERNAL_ERROR", 500, e?.message ?? "Upload failed");
	}
}
