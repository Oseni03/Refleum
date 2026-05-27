import { completeJson } from "@/lib/llm";
import {
	PARSE_RESUME_PROMPT,
	RESUME_SCHEMA_EXAMPLE,
} from "@/lib/prompts/templates";
import { restoreDatesFromMarkdown } from "@/lib/resume-utils";
import { convertToMarkdown } from "@cognipeer/to-markdown";
import { marked } from "marked";
import { ApiErrorCode } from "./api";

// ─── PDF to Markdown ──────────────────────────────────────────────────────────

async function pdfToMarkdown(buffer: Buffer): Promise<string> {
	try {
		const result = await convertToMarkdown(buffer);
		return result.trim();
	} catch (err) {
		console.error("PDF parsing error:", err);
		throw new Error(
			"Failed to parse PDF document. Ensure it is not password protected.",
		);
	}
}

// ─── DOCX to Markdown ─────────────────────────────────────────────────────────

async function docxToMarkdown(buffer: Buffer): Promise<string> {
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
	filename: string,
): Promise<string> {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "";

	if (ext === "pdf") {
		return pdfToMarkdown(content);
	}

	if (ext === "doc" || ext === "docx") {
		return docxToMarkdown(content);
	}

	throw new Error(
		`Unsupported file type: .${ext}. Only PDF and DOCX are supported.`,
	);
}

function wrapHtml(body: string): string {
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
    </style>
</head>
<body>
    <div class="page">${body}</div>
</body>
</html>`;
}

// ─── Full Resume Parsing (Document → Markdown → JSON) ────────────────────────

/**
 * High-level entry point for resume parsing.
 * 1. Extracts Markdown from the file buffer (PDF/DOCX).
 * 2. Uses LLM to extract structured JSON from the Markdown.
 * 3. Patches dates and returns both formats.
 */
export async function extractTextFromDocument(
	buffer: Buffer,
	filename: string,
): Promise<
	| { success: true; data: { markdown: string; html: string } }
	| { success: false; error: ApiErrorCode }
> {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "";

	try {
		let markdown: string;
		if (ext === "pdf") {
			markdown = await pdfToMarkdown(buffer);
		} else if (ext === "doc" || ext === "docx") {
			markdown = await docxToMarkdown(buffer);
		} else {
			return {
				success: false,
				error: "FILE_NOT_SUPPORTED",
			};
		}
		const html = wrapHtml(await marked(markdown));
		return { success: true, data: { markdown, html } };
	} catch (err: any) {
		console.error("Document parsing failed:", err);
		return {
			success: false,
			error: err.message || "DOCUMENT_PARSING_FAILED",
		};
	}
}

export async function parseResume(
	orgId: string,
	buffer: Buffer,
	filename: string,
): Promise<
	| {
			success: true;
			data: {
				markdown: string;
				html: string;
				structuredData: Record<string, unknown> | null;
				structuredDataError?: string;
			};
	  }
	| {
			success: false;
			error: string;
	  }
> {
	const extractResult = await extractTextFromDocument(buffer, filename);
	if (!extractResult.success) {
		return { success: false, error: extractResult.error };
	}

	const { markdown, html } = extractResult.data;

	try {
		const structuredData = await parseResumeToJson(orgId, markdown); // always use markdown for LLM
		return { success: true, data: { markdown, html, structuredData } };
	} catch (err: any) {
		console.error("Structured data parsing failed:", err);
		return {
			success: true,
			data: {
				markdown,
				html,
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
	markdownText: string,
): Promise<Record<string, unknown>> {
	const prompt = PARSE_RESUME_PROMPT.replace(
		"{schema}",
		RESUME_SCHEMA_EXAMPLE,
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

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
