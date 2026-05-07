import { PDFParse } from "pdf-parse";
import { completeJson } from "@/lib/llm";
import { PARSE_RESUME_PROMPT, RESUME_SCHEMA_EXAMPLE } from "@/lib/prompts/templates";
import { restoreDatesFromMarkdown } from "@/lib/resume-utils";
import { convertToMarkdown } from "@cognipeer/to-markdown";

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
export async function parseDocument(
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
    data: { originalMarkdown: string; structuredData: Record<string, unknown> }
} | {
    success: false;
    error: string
}> {
    try {
        const markdown = await parseDocument(buffer, filename);
        const structuredData = await parseResumeToJson(orgId, markdown);

        return {
            success: true,
            data: {
                originalMarkdown: markdown,
                structuredData
            }
        };
    } catch (err: any) {
        console.error("Resume parsing pipeline failed:", err);
        return {
            success: false,
            error: err.message || "PARSING_FAILED"
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