// src/server/llm-config.ts
// Pure query functions — no auth, no "use server".

import { encryptApiKey } from "@/lib/crypto";
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
        organizationId?: string; userId?: string;
    }>
): Promise<UpdateLlmConfigResult> {
    const existing = await prisma.llmConfig.findFirst({
        where: { OR: [{ organizationId: id }, { userId: id }] }
    });

    const { organizationId: orgIdOverride, userId: userIdOverride, ...rest } = updates;

    console.log("CONFIG REST", rest);

    // Encrypt apiKey if provided, then strip all undefined fields
    // so Prisma only touches columns that were explicitly sent
    const scalarUpdates = Object.fromEntries(
        Object.entries({
            ...rest,
            ...(rest.apiKey !== undefined && {
                apiKey: encryptApiKey(rest.apiKey)
            }),
        }).filter(([, v]) => v !== undefined)
    );

    console.log("CONFIG SCALAR UPDATES", scalarUpdates);

    if (Object.keys(scalarUpdates).length === 0) {
        return { success: true }; // nothing to update
    }

    if (existing) {
        await prisma.llmConfig.update({
            where: { id: existing.id },
            data: scalarUpdates,
        });
    } else {
        await prisma.llmConfig.create({
            data: {
                organizationId: orgIdOverride ?? id,
                userId: userIdOverride ?? null,
                ...scalarUpdates,
            }
        });
    }

    return { success: true };
}
