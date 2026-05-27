import { NextRequest } from "next/server";
import { regenerateOutreach } from "@/server/outreach";
import {
	authenticate,
	parseBody,
	apiOk,
	apiError,
	requirePlanOrError,
} from "@/lib/api";
import { z } from "zod";

const regenerateSchema = z.object({
	// Optional — falls back to the linked resume's stored job_description (FR-074)
	job_description: z.string().optional(),
});

// POST /api/v1/resumes/:id/outreaches/:oId/regenerate — AI regenerate in-place (FR-074)
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; oId: string }> },
) {
	const { id: resumeId, oId } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	const planErr = await requirePlanOrError(organizationId, "STARTER");
	if (planErr) return planErr;

	const { data: body, errResponse: bodyErr } = await parseBody(
		req,
		regenerateSchema,
	);
	if (bodyErr) return bodyErr;

	// Updates the record in-place — same oId returned (FR-074)
	const result = await regenerateOutreach(
		oId,
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
		return apiError(result.error, status);
	}

	return apiOk(result.data);
}
