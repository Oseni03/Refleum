import { NextRequest, NextResponse } from "next/server";
import {
	generatePdfFromHtml,
	getCachedResumePdf,
	cacheResumePdf,
} from "@/server/pdf";
import { authenticate, apiError } from "@/lib/api";
import { recordUsage } from "@/server/subscription";
import { prisma } from "@/lib/prisma";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { ownerId: organizationId, errResponse } = await authenticate(req);
	if (errResponse) return errResponse;

	try {
		const { searchParams } = new URL(req.url);
		const format = (searchParams.get("format") || "A4") as any;

		const cachedPdf = await getCachedResumePdf(id, organizationId);
		if (cachedPdf) {
			await recordUsage(organizationId, "pdf_export");
			return new NextResponse(cachedPdf as any, {
				status: 200,
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="resume-${id}.pdf"`,
				},
			});
		}

		const resume = await prisma.resume.findFirst({
			where: { id, organizationId },
			select: { html: true },
		});

		if (!resume) {
			return apiError("NOT_FOUND", 404);
		}

		if (!resume.html) {
			return apiError("RESUME_NOT_RENDERED", 422);
		}

		const pdfBuffer = await generatePdfFromHtml(resume.html, format);

		cacheResumePdf(id, organizationId, Buffer.from(pdfBuffer)).catch(
			() => {},
		);
		await recordUsage(organizationId, "pdf_export");

		return new NextResponse(pdfBuffer as any, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="resume-${id}.pdf"`,
			},
		});
	} catch (error) {
		return apiError("PDF_RENDER_FAILED", 503);
	}
}
