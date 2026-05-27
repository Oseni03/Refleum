import { NextRequest } from "next/server";
import {
	getCoverLetterById,
	deleteCoverLetterRecord,
} from "@/server/cover-letters";
import { authenticate, apiOk, apiError } from "@/lib/api";

// GET /api/v1/resumes/:id/cover-letters/:clId
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; clId: string }> },
) {
	const { id: resumeId, clId } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	// organizationId scopes the lookup — no cross-tenant access possible (FR-092)
	const result = await getCoverLetterById(resumeId, clId, organizationId);
	if (!result.success) {
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

	return apiOk(result.data);
}

// DELETE /api/v1/resumes/:id/cover-letters/:clId
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; clId: string }> },
) {
	const { id: resumeId, clId } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	const result = await deleteCoverLetterRecord(
		resumeId,
		clId,
		organizationId,
	);
	if (!result.success) {
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

	return apiOk({ success: true });
}
