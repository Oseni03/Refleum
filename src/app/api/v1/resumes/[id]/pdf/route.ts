import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePdfFromHtml } from "@/server/pdf";

// GET /api/v1/resumes/:id/pdf
// Unauthenticated — returns the raw PDF binary for the resume.
// Serves the cached `pdf` bytes when available; falls back to on-the-fly
// rendering and caches the result back to the database.
export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	try {
		const resume = await prisma.resume.findUnique({
			where: { id },
			select: {
				id: true,
				pdf: true,
				html: true,
				filename: true,
			},
		});

		if (!resume) {
			return new NextResponse("Resume not found", { status: 404 });
		}

		let pdfBuffer: Buffer;

		if (resume.pdf) {
			pdfBuffer = Buffer.from(resume.pdf);
		} else {
			// On-the-fly rendering fallback — cache result for subsequent requests
			pdfBuffer = await generatePdfFromHtml(resume.html);

			await prisma.resume.update({
				where: { id },
				data: { pdf: pdfBuffer },
			});
		}

		return new NextResponse(new Uint8Array(pdfBuffer), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `inline; filename="${encodeURIComponent(
					resume.filename || "resume",
				)}.pdf"`,
			},
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		console.error(`Error serving PDF for resume ${id}:`, message);
		return new NextResponse("Failed to load PDF", { status: 500 });
	}
}
