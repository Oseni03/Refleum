import { NextRequest } from "next/server";
import {
	getResumeById,
	updateResumeRecord,
	deleteResumeRecord,
} from "@/server/resumes";
import { z } from "zod";
import { ResumeStatus } from "@prisma/client";
import { authenticate, parseBody, apiOk, apiError } from "@/lib/api";

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
	if (errResponse) return errResponse;

	const result = await getResumeById(id, organizationId);
	if (!result.success) {
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

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
	if (errResponse) return errResponse;

	const { data: body, errResponse: bodyErr } = await parseBody(
		req,
		updateSchema,
	);
	if (bodyErr) return bodyErr;

	const result = await updateResumeRecord(id, organizationId, body);
	if (!result.success) {
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

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
	if (errResponse) return errResponse;

	const result = await deleteResumeRecord(id, organizationId);
	if (!result.success) {
		const status = result.error === "NOT_FOUND" ? 404 : 500;
		return apiError(result.error, status);
	}

	return apiOk({ success: true });
}
