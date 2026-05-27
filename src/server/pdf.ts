import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { prisma } from "@/lib/prisma";
import { getResumeById } from "./resumes";
import { getCoverLetterById } from "./cover-letters";

export type PdfFormat = "A4" | "Letter";

export async function generatePdfFromHtml(
	htmlContent: string,
	format: PdfFormat = "A4",
) {
	const executablePath = await chromium.executablePath();

	const browser = await puppeteer.launch({
		args: chromium.args,
		defaultViewport: null,
		executablePath,
		headless: true,
	});

	try {
		const page = await browser.newPage();
		await page.setContent(htmlContent, { waitUntil: "load" });

		const pdfBuffer = await page.pdf({
			format,
			printBackground: true,
			margin: {
				top: "0.75in",
				right: "0.75in",
				bottom: "0.75in",
				left: "0.75in",
			},
		});

		return Buffer.from(pdfBuffer);
	} finally {
		await browser.close();
	}
}

export async function cacheResumePdf(
	resumeId: string,
	organizationId: string,
	buffer: Buffer,
): Promise<void> {
	await prisma.resume.updateMany({
		where: { id: resumeId, organizationId },
		data: { pdf: buffer },
	});
}

export async function getCachedResumePdf(
	resumeId: string,
	organizationId: string,
): Promise<Buffer | null> {
	const row = await prisma.resume.findFirst({
		where: { id: resumeId, organizationId },
		select: { pdf: true },
	});

	if (!row?.pdf) return null;
	return Buffer.from(row.pdf);
}

export async function generateResumePdf(
	resumeId: string,
	organizationId: string,
	format: PdfFormat = "A4",
) {
	const result = await getResumeById(resumeId, organizationId);
	if (!result.success) throw new Error("Resume not found");

	return generatePdfFromHtml(result.data.html, format);
}

export async function generateCoverLetterPdf(
	resumeId: string,
	coverLetterId: string,
	organizationId: string,
	format: PdfFormat = "A4",
) {
	const result = await getCoverLetterById(
		resumeId,
		coverLetterId,
		organizationId,
	);
	if (!result.success) throw new Error("Cover Letter not found");

	const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; line-height: 1.6; color: #1a1a1a; }
                .content { white-space: pre-wrap; font-family: inherit; }
                .date { margin-bottom: 20px; }
                .recipient { margin-bottom: 20px; }
                .signature { margin-top: 40px; }
            </style>
        </head>
        <body>
            <div class="content">${result.data.content}</div>
        </body>
        </html>
    `;

	return generatePdfFromHtml(html, format);
}
