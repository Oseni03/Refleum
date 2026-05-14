import puppeteer from "puppeteer";
import { getResumeById } from "./resumes";
import { getCoverLetterById } from "./cover-letters";

export type PdfFormat = "A4" | "Letter";

export async function generatePdfFromHtml(htmlContent: string, format: PdfFormat = "A4") {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format,
            printBackground: true,
            margin: {
                top: '0.75in',
                right: '0.75in',
                bottom: '0.75in',
                left: '0.75in'
            }
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

export async function generateResumePdf(resumeId: string, organizationId: string, format: PdfFormat = "A4") {
    const result = await getResumeById(resumeId, organizationId);
    if (!result.success) throw new Error("Resume not found");

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 20px; line-height: 1.5; color: #1a1a1a; }
                h1 { font-size: 24px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                h2 { font-size: 18px; margin-top: 20px; color: #333; text-transform: uppercase; letter-spacing: 0.05em; }
                pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
                .section { margin-bottom: 20px; }
                .bullet { margin-left: 20px; display: list-item; }
            </style>
        </head>
        <body>
            <h1>${result.data.title || 'Resume'}</h1>
            <pre>${result.data.originalMarkdown}</pre>
        </body>
        </html>
    `;

    return generatePdfFromHtml(html, format);
}

export async function generateCoverLetterPdf(coverLetterId: string, organizationId: string, format: PdfFormat = "A4") {
    const result = await getCoverLetterById(coverLetterId, organizationId);
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
