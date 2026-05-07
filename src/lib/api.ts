// src/lib/api.ts
// Shared response helpers and Zod schemas for all API route handlers.
// Import from here — never construct NextResponse.json() shapes ad-hoc.

import { NextResponse } from "next/server";
import { z } from "zod";

// ─── Standard response constructors ──────────────────────────────────────────

/** Success: { data: T } */
export function apiOk<T>(data: T, status = 200): NextResponse {
    return NextResponse.json({ data }, { status });
}

/** Created: { data: T } with 201 */
export function apiCreated<T>(data: T): NextResponse {
    return NextResponse.json({ data }, { status: 201 });
}

/** Error: { error: code } */
export function apiError(
    code: ApiErrorCode,
    status: number,
    detail?: string
): NextResponse {
    return NextResponse.json(
        { error: code, ...(detail ? { detail } : {}) },
        { status }
    );
}

// ─── Canonical error codes ────────────────────────────────────────────────────

export type ApiErrorCode =
    | "MISSING_KEY"
    | "INVALID_KEY"
    | "UNAUTHORIZED"
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "PLAN_REQUIRED"
    | "CONFLICT"
    | "UNPROCESSABLE"
    | "TIMEOUT"
    | "INTERNAL_ERROR"
    | "NO_JOBS_PROVIDED"
    | "EMPTY_JOB_DESCRIPTION"
    | "NO_PROCESSED_DATA"
    | "NOT_TAILORED_RESUME"
    | "PREVIEW_REQUIRED"
    | "HASH_MISMATCH"
    | "PERSONAL_INFO_CHANGED"
    | "APPLY_CONFLICT";

// ─── Auth helper for route handlers ──────────────────────────────────────────

import { requireApiKey } from "@/lib/middleware";
import type { NextRequest } from "next/server";

/** One-liner auth check — returns ownerId or a ready-to-return error response. */
export async function authenticate(
    req: NextRequest
): Promise<{ ownerId: string; errResponse: null } | { ownerId: null; errResponse: NextResponse }> {
    const result = await requireApiKey(req);
    if (!result.valid || !result.organizationId) {
        const status = result.error === "MISSING_KEY" ? 401 : 401;
        return {
            ownerId: null,
            errResponse: apiError(result.error || "UNAUTHORIZED", status),
        };
    }
    return { ownerId: result.organizationId, errResponse: null };
}

/** Parse + validate request body with a Zod schema. */
export async function parseBody<T>(
    req: NextRequest,
    schema: z.ZodSchema<T>
): Promise<{ data: T; errResponse: null } | { data: null; errResponse: NextResponse }> {
    let raw: unknown;
    try {
        raw = await req.json();
    } catch {
        return { data: null, errResponse: apiError("VALIDATION_ERROR", 400, "Invalid JSON body") };
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
        const detail = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return { data: null, errResponse: apiError("VALIDATION_ERROR", 422, detail) };
    }

    return { data: result.data, errResponse: null };
}

// ─── Reusable Zod schemas ─────────────────────────────────────────────────────

export const ImprovePreviewSchema = z.object({
    resume_id: z.string().min(1),
    job_id: z.string().min(1),
    prompt_id: z.enum(["nudge", "keywords", "full"]).optional(),
});

export const ImproveConfirmSchema = z.object({
    resume_id: z.string().min(1),
    job_id: z.string().min(1),
    improved_data: z.record(z.string(), z.unknown()),
    improvements: z.array(
        z.object({ suggestion: z.string(), lineNumber: z.number().nullable().optional() })
    ),
});

export const JobUploadSchema = z.object({
    job_descriptions: z.array(z.string().min(1)).min(1, "At least one job description required"),
    resume_id: z.string().optional().nullable(),
});

export const UpdateCoverLetterSchema = z.object({
    content: z.string().min(1),
});

export const UpdateTitleSchema = z.object({
    title: z.string().min(1).max(80),
});

export const UpdateOutreachSchema = z.object({
    content: z.string().min(1),
});

export const EnhanceRequestSchema = z.object({
    resume_id: z.string().min(1),
    answers: z.array(
        z.object({
            question_id: z.string(),
            answer: z.string(),
            item_id: z.string().optional().nullable(),
            question_text: z.string().optional().nullable(),
        })
    ).min(1),
});

export const RegenerateRequestSchema = z.object({
    resume_id: z.string().min(1),
    items: z.array(
        z.object({
            item_id: z.string(),
            item_type: z.enum(["experience", "project", "skills"]),
            title: z.string(),
            subtitle: z.string().optional().nullable(),
            current_content: z.array(z.string()),
        })
    ).min(1),
    instruction: z.string().min(1).max(2000),
    output_language: z.string().optional(),
});

export const ApplyEnhancementsSchema = z.object({
    enhancements: z.array(
        z.object({
            item_id: z.string(),
            item_type: z.string(),
            title: z.string(),
            original_description: z.array(z.string()),
            enhanced_description: z.array(z.string()),
        })
    ),
});

export const LlmConfigSchema = z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    apiKey: z.string().optional(),
    apiBase: z.string().nullable().optional(),
    reasoningEffort: z.enum(["minimal", "low", "medium", "high", ""]).nullable().optional(),
    enableCoverLetter: z.boolean().optional(),
    enableOutreachMessage: z.boolean().optional(),
    contentLanguage: z.string().optional(),
    defaultPromptId: z.string().optional(),
});