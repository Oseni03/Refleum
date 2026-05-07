// src/server/llm-config.ts
// Pure query functions — no auth, no "use server".

import { prisma } from "@/lib/prisma";
import type { LlmConfigPayload, GetLlmConfigResult, UpdateLlmConfigResult } from "@/types";

// ─── Query functions ──────────────────────────────────────────────────────────

/** Returns the masked config payload safe to expose to clients. */
export async function getLlmConfig(id: string): Promise<LlmConfigPayload> {
    const c = await getRawLlmConfig(id);
    return {
        provider: (c?.provider ?? "openai") as LlmConfigPayload["provider"],
        model: c?.model ?? "gpt-4o",
        apiKey: c?.apiKey ? "••••" + c.apiKey.slice(-4) : "",
        apiBase: c?.apiBase ?? null,
        reasoningEffort: (c?.reasoningEffort ?? null) as LlmConfigPayload["reasoningEffort"],
        enableCoverLetter: c?.enableCoverLetter ?? false,
        enableOutreachMessage: c?.enableOutreachMessage ?? false,
        contentLanguage: c?.contentLanguage ?? "en",
        defaultPromptId: c?.defaultPromptId ?? "keywords",
    };
}

/** Returns the raw (unmasked) config for internal LLM calls. */
export async function getRawLlmConfig(id: string): Promise<{
    provider: string; model: string; apiKey: string | null; apiBase: string | null;
    reasoningEffort: string | null; enableCoverLetter: boolean;
    enableOutreachMessage: boolean; contentLanguage: string; defaultPromptId: string;
} | null> {
    // Try to find by organizationId first, then by userId
    return prisma.llmConfig.findFirst({
        where: {
            OR: [
                { organizationId: id },
                { userId: id }
            ]
        },
        select: {
            provider: true, model: true, apiKey: true, apiBase: true,
            reasoningEffort: true, enableCoverLetter: true,
            enableOutreachMessage: true, contentLanguage: true, defaultPromptId: true,
        },
    });
}

export async function updateLlmConfig(
    id: string,
    updates: Partial<{
        provider: string; model: string; apiKey: string; apiBase: string | null;
        reasoningEffort: string | null; enableCoverLetter: boolean;
        enableOutreachMessage: boolean; contentLanguage: string; defaultPromptId: string;
        organizationId?: string;
    }>
): Promise<UpdateLlmConfigResult> {
    // If id is provided, we try to update based on organizationId or userId
    const existing = await prisma.llmConfig.findFirst({
        where: {
            OR: [
                { organizationId: id },
                { userId: id }
            ]
        }
    });

    if (existing) {
        await prisma.llmConfig.update({
            where: { id: existing.id },
            data: updates,
        });
    } else {
        // Fallback to create (assumes id is either orgId or userId)
        // If it's a new config, we might need more info, but for now we follow the upsert logic
        await prisma.llmConfig.create({
            data: {
                organizationId: updates.organizationId || id,
                userId: id,
                ...updates
            }
        });
    }
    return { success: true };
}
