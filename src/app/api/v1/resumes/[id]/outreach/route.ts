import { NextRequest } from "next/server";
import { listOutreachMessages, generateOutreach } from "@/server/outreach";
import {
	authenticate,
	parseBody,
	apiCreated,
	apiOk,
	apiError,
	parsePagination,
	requirePlanOrError,
} from "@/lib/api";
import { z } from "zod";

const generateSchema = z.object({
	// Optional — falls back to the resume's stored job_description (FR-070)
	job_description: z.string().optional(),
});

// GET /api/v1/resumes/:id/outreaches — list outreach messages for this resume
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id: resumeId } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	const { limit, offset } = parsePagination(req);

	// resumeId is now from the URL — no ?resume_id= query param needed
	const result = await listOutreachMessages(organizationId, resumeId, {
		limit,
		offset,
	});
	if (!result.success) return apiError(result.error as any, 500);

	return apiOk(result.data);
}

// POST /api/v1/resumes/:id/outreaches — generate an outreach message for this resume
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id: resumeId } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	const planErr = await requirePlanOrError(organizationId, "STARTER");
	if (planErr) return planErr;

	const { data: body, errResponse: bodyErr } = await parseBody(
		req,
		generateSchema,
	);
	if (bodyErr) return bodyErr;

	const result = await generateOutreach(
		resumeId,
		organizationId,
		body?.job_description,
	);
	if (!result.success) {
		const status =
			result.error === "NOT_FOUND"
				? 404
				: result.error === "NO_JOB_DESCRIPTION"
					? 400
					: 500;
		return apiError(result.error as any, status);
	}

	return apiCreated(result.data);
}
