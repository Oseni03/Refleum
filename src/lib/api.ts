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
    | "APPLY_CONFLICT"
    | "RATE_LIMITED";

// ─── Auth helper for route handlers ──────────────────────────────────────────

import { requireApiKey, requireRateLimit } from "@/lib/middleware";
import type { NextRequest } from "next/server";
import { getSubscriptionPlan } from "@/server/subscription";
import { TailorStrategy } from "@prisma/client";

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
    const plan = await getSubscriptionPlan(result.organizationId);
    const rateLimit = await requireRateLimit(result.organizationId, plan);
    if (!rateLimit.allowed) {
        return {
            ownerId: null,
            errResponse: apiError("RATE_LIMITED", 429)
        }
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

export const UpdateCoverLetterSchema = z.object({
    content: z.string().min(1),
});

export const UpdateOutreachSchema = z.object({
    content: z.string().min(1),
});

// Snake_case schema that matches the incoming request body
export const LlmConfigSchema = z.object({
    provider: z.string().optional(),
    model: z.string().optional(),
    api_key: z.string().optional(),
    api_base: z.string().nullable().optional(),
    reasoning_effort: z.enum(["minimal", "low", "medium", "high", ""]).nullable().optional(),
    enable_cover_letter: z.boolean().optional().default(false),
    enable_outreach_message: z.boolean().optional().default(false),
    content_language: z.string().optional().default("en"),
    default_prompt_id: z.string().optional(),
}).transform((data) => ({
    provider: data.provider,
    model: data.model,
    apiKey: data.api_key,
    apiBase: data.api_base,
    reasoningEffort: data.reasoning_effort,
    enableCoverLetter: data.enable_cover_letter,
    enableOutreachMessage: data.enable_outreach_message,
    contentLanguage: data.content_language,
    defaultPromptId: data.default_prompt_id,
}));

export const tailorSchema = z.object({
    job_description: z.string().min(50),
    strategy: z.nativeEnum(TailorStrategy).optional(),
    generate_cover_letter: z.boolean().optional().default(false),
    generate_outreach: z.boolean().optional().default(false),
    output_language: z.string().optional(),
}).transform((data) => ({
    jobDescription: data.job_description,
    strategy: data.strategy,
    generateCoverLetter: data.generate_cover_letter,
    generateOutreach: data.generate_outreach,
    outputLanguage: data.output_language,
}));