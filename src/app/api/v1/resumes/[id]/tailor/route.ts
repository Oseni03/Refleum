import { NextRequest, after } from "next/server";
import { tailorResume } from "@/server/resumes";
import { TailorStrategy } from "@prisma/client";
import { z } from "zod";
import {
	authenticate,
	parseBody,
	tailorSchema,
	requirePlanOrError,
	apiCreated,
	apiError,
} from "@/lib/api";
import { recordUsage } from "@/server/subscription";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	const planErr = await requirePlanOrError(organizationId, "STARTER");
	if (planErr) return planErr;

	try {
		const { data: body, errResponse: bodyErr } = await parseBody(
			req,
			tailorSchema,
		);
		if (bodyErr) return bodyErr;

		// Tailoring itself still runs in-request for now as it produces the new resume record
		const result = await tailorResume(organizationId, {
			resumeId: id,
			jobDescription: body.jobDescription,
			strategy: body.strategy?.toUpperCase() as TailorStrategy,
			outputLanguage: body.outputLanguage?.toLowerCase(),
			generatePdf: body.generatePdf,
		});

		if (!result.success) {
			if (result.error === "NO_MASTER_RESUME") {
				return apiError(
					"NO_MASTER_RESUME",
					400,
					"No master resume found. Provide resume_id or upload a master resume.",
				);
			}
			return apiError(result.error, 500);
		}

		const data = result.data;

		await recordUsage(organizationId, "tailor", id);

		return apiCreated({
			resume_id: data.resume.id,
			is_master: data.resume.isMaster,
			status: data.resume.status,
			filename: data.resume.filename,
			strategy: data.resume.strategy,
			job_keywords: data.resume.jobKeywords,
			parent_id: data.resume.parentId,
			pdf_url: data.pdf_url,
			refinement_stats: data.refinement_stats,
			warnings: data.warnings,
		});
	} catch (e) {
		if (e instanceof z.ZodError) {
			return apiError("VALIDATION_ERROR", 400, e.message);
		}
		return apiError("TAILORING_FAILED", 500);
	}
}
