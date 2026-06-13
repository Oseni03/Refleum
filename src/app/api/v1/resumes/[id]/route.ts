import { NextRequest } from "next/server";
import {
	getResumeById,
	updateResumeRecord,
	deleteResumeRecord,
} from "@/server/resumes";
import { z } from "zod";
import { ResumeStatus } from "@prisma/client";
import { authenticate, parseBody, apiOk, apiError } from "@/lib/api";
import logger from "@/lib/logger"; // ← Added

const updateSchema = z.object({
	title: z.string().optional(),
	structuredData: z.any().optional(),
	status: z.enum(ResumeStatus).optional(),
	filename: z.string().optional(),
});

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);

	logger.http(`GET /api/v1/resumes/${id}`, { organizationId });

	if (errResponse) {
		logger.warn(`Auth failed for resume GET ${id}`, { organizationId });
		return errResponse;
	}

	const result = await getResumeById(id, organizationId);
	if (!result.success) {
		logger.error(`Failed to get resume ${id}`, {
			organizationId,
			error: result.error,
		});
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

	logger.info(`Resume retrieved`, { resumeId: id, organizationId });

	const origin = req.nextUrl.origin;
	const dataWithPdfUrl = {
		...result.data,
		pdfUrl: `${origin}/api/v1/resumes/${result.data.id}/pdf`,
	};

	return apiOk(dataWithPdfUrl);
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);

	logger.http(`PATCH /api/v1/resumes/${id}`, { organizationId });

	if (errResponse) {
		logger.warn(`Auth failed for resume PATCH ${id}`, { organizationId });
		return errResponse;
	}

	const { data: body, errResponse: bodyErr } = await parseBody(
		req,
		updateSchema,
	);
	if (bodyErr) {
		logger.warn(`Invalid body for resume update ${id}`, {
			organizationId,
			error: bodyErr,
		});
		return bodyErr;
	}

	const result = await updateResumeRecord(id, organizationId, body);
	if (!result.success) {
		logger.error(`Failed to update resume ${id}`, {
			organizationId,
			error: result.error,
		});
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

	logger.info(`Resume updated successfully`, {
		resumeId: id,
		organizationId,
		updatedFields: Object.keys(body),
	});

	const origin = req.nextUrl.origin;
	const dataWithPdfUrl = {
		...result.data,
		pdfUrl: `${origin}/api/v1/resumes/${result.data.id}/pdf`,
	};

	return apiOk(dataWithPdfUrl);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);

	logger.http(`DELETE /api/v1/resumes/${id}`, { organizationId });

	if (errResponse) {
		logger.warn(`Auth failed for resume DELETE ${id}`, { organizationId });
		return errResponse;
	}

	const result = await deleteResumeRecord(id, organizationId);
	if (!result.success) {
		logger.error(`Failed to delete resume ${id}`, {
			organizationId,
			error: result.error,
		});
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

	logger.info(`Resume deleted`, { resumeId: id, organizationId });
	return apiOk({ success: true });
}
