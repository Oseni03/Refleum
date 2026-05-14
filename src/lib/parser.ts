import { PDFParse } from "pdf-parse";
import { completeJson } from "@/lib/llm";
import { PARSE_RESUME_PROMPT, RESUME_SCHEMA_EXAMPLE } from "@/lib/prompts/templates";
import { restoreDatesFromMarkdown } from "@/lib/resume-utils";
import { convertToMarkdown } from "@cognipeer/to-markdown";

import * as pdfjs from "pdfjs-dist";

async function pdfToHtml(pdfBuffer: Buffer): Promise<string> {
    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;

    let bodyHtml = "";
    const globalStyles = new Map<string, any>();

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent({ includeMarkedContent: true });
        const viewport = page.getViewport({ scale: 1 });

        // Collect styles
        for (const [name, style] of Object.entries(content.styles as any)) {
            globalStyles.set(name, style);
        }

        const pageItems = content.items
            .filter((item): item is any => "str" in item && item.str.trim().length > 0)
            .map((item) => {
                const style = globalStyles.get(item.fontName) as any;
                const fontSize = Math.round(item.height);
                const isBold = style?.fontFamily?.toLowerCase().includes("bold");
                const isItalic = style?.fontFamily?.toLowerCase().includes("italic");

                // Normalize Y position (pdfjs Y is bottom-up)
                const top = viewport.height - item.transform[5];
                const left = item.transform[4];

                return { str: item.str, fontSize, isBold, isItalic, top, left, width: item.width };
            })
            .sort((a, b) => a.top - b.top || a.left - b.left);

        // Group items into lines by proximity
        const lines: typeof pageItems[] = [];
        for (const item of pageItems) {
            const lastLine = lines[lines.length - 1];
            if (lastLine && Math.abs(item.top - lastLine[0].top) < 5) {
                lastLine.push(item);
            } else {
                lines.push([item]);
            }
        }

        bodyHtml += `<div class="page">`;
        for (const line of lines) {
            const { fontSize, isBold, isItalic } = line[0];
            const text = line.map(item => item.str).join(" ");

            // Map font size to semantic tags
            let tag = "p";
            if (fontSize >= 20) tag = "h1";
            else if (fontSize >= 16) tag = "h2";
            else if (fontSize >= 13) tag = "h3";

            const styleAttr = [
                fontSize && tag === "p" ? `font-size: ${fontSize}px` : "",
                isBold ? "font-weight: 700" : "",
                isItalic ? "font-style: italic" : "",
            ].filter(Boolean).join("; ");

            bodyHtml += `<${tag}${styleAttr ? ` style="${styleAttr}"` : ""}>${text}</${tag}>\n`;
        }
        bodyHtml += `</div>`;

        // Page break between pages
        if (i < pdf.numPages) bodyHtml += `<div class="page-break"></div>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #1a1a1a; line-height: 1.6; }
        .page { padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 22px; font-weight: 700; padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; margin-bottom: 16px; }
        h2 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 8px; }
        h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        p  { font-size: 14px; margin-bottom: 8px; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ─── PDF to Markdown ──────────────────────────────────────────────────────────

async function pdfToMarkdown(buffer: Buffer): Promise<string> {
    try {
        // const data = new PDFParse({ data: buffer });
        // // pdf-parse gives us plain text — convert line breaks for markdown readability
        // return (await data.getText()).text
        //     .replace(/\r\n/g, "\n")
        //     .replace(/\n{3,}/g, "\n\n")
        //     .trim();
        const result = await convertToMarkdown(buffer);
        return result.trim();
    } catch (err) {
        console.error("PDF parsing error:", err);
        throw new Error("Failed to parse PDF document. Ensure it is not password protected.");
    }
}


// ─── DOCX to Markdown ─────────────────────────────────────────────────────────

async function docxToMarkdown(buffer: Buffer): Promise<string> {
    // mammoth.convertToMarkdown produces cleaner structure than plain text
    // const result = await mammoth.convertToMarkdown({ buffer });
    const result = await convertToMarkdown(buffer);
    return result.trim();
}

// ─── Parse Document (PDF/DOCX → Markdown) ────────────────────────────────────

/**
 * Convert a PDF or DOCX file buffer to Markdown text.
 * Equivalent to Python's parse_document().
 */
export async function parseToMarkdown(
    content: Buffer,
    filename: string
): Promise<string> {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";

    if (ext === "pdf") {
        return pdfToMarkdown(content);
    }

    if (ext === "doc" || ext === "docx") {
        return docxToMarkdown(content);
    }

    throw new Error(
        `Unsupported file type: .${ext}. Only PDF and DOCX are supported.`
    );
}

// ─── Full Resume Parsing (Document → Markdown → JSON) ────────────────────────

/**
 * High-level entry point for resume parsing.
 * 1. Extracts Markdown from the file buffer (PDF/DOCX).
 * 2. Uses LLM to extract structured JSON from the Markdown.
 * 3. Patches dates and returns both formats.
 */
export async function parseResume(
    orgId: string,
    buffer: Buffer,
    filename: string
): Promise<{
    success: true;
    data: {
        originalMarkdown: string;
        structuredData: Record<string, unknown> | null;
        structuredDataError?: string;
    }
} | {
    success: false;
    error: string
}> {
    let markdown: string;

    try {
        markdown = await parseToMarkdown(buffer, filename);
    } catch (err: any) {
        console.error("Document parsing failed:", err);
        return { success: false, error: err.message || "DOCUMENT_PARSING_FAILED" };
    }

    // Markdown is available — structured parsing failure is non-fatal
    try {
        const structuredData = await parseResumeToJson(orgId, markdown);
        return { success: true, data: { originalMarkdown: markdown, structuredData } };
    } catch (err: any) {
        console.error("Structured data parsing failed:", err);
        return {
            success: true,
            data: {
                originalMarkdown: markdown,
                structuredData: null,
                structuredDataError: err.message || "STRUCTURED_PARSING_FAILED",
            },
        };
    }
}

// ─── Parse Resume to JSON ─────────────────────────────────────────────────────

/**
 * Parse resume Markdown to structured JSON using the LLM.
 * After parsing, patches any year-only dates with month-inclusive dates
 * extracted from the raw Markdown. Equivalent to Python's parse_resume_to_json().
 *
 * @param orgId  Organization ID — used to resolve the correct LLM config.
 * @param markdownText  Resume content in Markdown format.
 */
export async function parseResumeToJson(
    orgId: string,
    markdownText: string
): Promise<Record<string, unknown>> {
    const prompt = PARSE_RESUME_PROMPT.replace(
        "{schema}",
        RESUME_SCHEMA_EXAMPLE
    ).replace("{resume_text}", markdownText);

    const result = await completeJson(orgId, prompt, {
        systemPrompt:
            "You are a JSON extraction engine. Output only valid JSON, no explanations.",
    });

    if (!result.success) {
        throw new Error(`LLM_PARSING_FAILED: ${result.error}`);
    }

    // Patch dates: restore months the LLM may have dropped
    return restoreDatesFromMarkdown(result.data, markdownText);
}

// ─── Validate MIME Type ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isAllowedMimeType(contentType: string): boolean {
    return ALLOWED_MIME_TYPES.has(contentType);
}

export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB