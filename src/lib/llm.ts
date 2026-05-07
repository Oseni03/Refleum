// src/lib/llm.ts
// LLM client wrapper. Multi-provider support via the Vercel AI SDK or direct SDK calls.
// Never call provider SDKs directly from route handlers — always use this module.

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getRawLlmConfig } from "@/server/llm-config";
import type { LlmProvider } from "@/types";

// ─── Config Resolution ────────────────────────────────────────────────────────

interface ResolvedConfig {
    provider: LlmProvider;
    model: string;
    apiKey: string;
    apiBase: string | null;
    reasoningEffort: string | null;
}

async function resolveConfig(orgId: string): Promise<ResolvedConfig> {
    const stored = await getRawLlmConfig(orgId);
    return {
        provider: (stored?.provider ?? process.env.DEFAULT_LLM_PROVIDER ?? "openai") as LlmProvider,
        model: stored?.model ?? process.env.DEFAULT_LLM_MODEL ?? "gpt-4o",
        apiKey: stored?.apiKey ?? process.env.OPENAI_API_KEY ?? "",
        apiBase: stored?.apiBase ?? null,
        reasoningEffort: stored?.reasoningEffort ?? null,
    };
}

// ─── Injection Sanitizer ──────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /disregard\s+(all\s+)?above/gi,
    /forget\s+(everything|all)/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /<\s*\/?\s*system\s*>/gi,
    /\[\s*INST\s*\]/gi,
    /\[\s*\/\s*INST\s*\]/gi,
] as const;

export function sanitizeUserInput(text: string): string {
    return INJECTION_PATTERNS.reduce(
        (acc, pattern) => acc.replace(pattern, "[REDACTED]"),
        text
    );
}

// ─── Sensitive Info Scrubber ──────────────────────────────────────────────────

export function scrubApiKeys(text: string): string {
    return text.replace(/sk-[A-Za-z0-9_\-*.]{12,}/g, "<redacted>");
}

function stripThinkingTags(content: string): string {

    return content
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/<think>[\s\S]*/g, "")
        .trim();
}

// ─── JSON Extractor ───────────────────────────────────────────────────────────

export function extractJson(content: string, depth = 0): string {
    if (depth > 10) throw new Error("JSON extraction exceeded max recursion depth");
    if (content.length > 1024 * 1024) throw new Error("Content too large for JSON extraction");

    let processed = content;

    if (processed.includes("<think>")) {
        processed = stripThinkingTags(processed);
    }

    // Strip markdown code fences
    if (processed.includes("```json")) {
        processed = processed.split("```json")[1]?.split("```")[0] ?? processed;
    } else if (processed.includes("```")) {
        const parts = processed.split("```");
        if (parts.length >= 2) {
            processed = parts[1] ?? processed;
            if (processed.startsWith("json") || processed.startsWith("JSON")) {
                processed = processed.slice(4);
            }
        }
    }

    processed = processed.trim();

    if (processed.startsWith("{")) {
        let depth_ = 0;
        let endIdx = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < processed.length; i++) {
            const char = processed[i];
            if (escapeNext) { escapeNext = false; continue; }
            if (char === "\\") { escapeNext = true; continue; }
            if (char === '"' && !escapeNext) { inString = !inString; continue; }
            if (inString) continue;
            if (char === "{") depth_++;
            else if (char === "}") {
                depth_--;
                if (depth_ === 0) { endIdx = i; break; }
            }
        }

        if (endIdx !== -1) return processed.slice(0, endIdx + 1);
    }

    const startIdx = processed.indexOf("{");
    if (startIdx > 0) return extractJson(processed.slice(startIdx), depth + 1);

    throw new Error(`No JSON found in response: ${content.slice(0, 200)}`);
}

// ─── Provider Clients ─────────────────────────────────────────────────────────

function makeOpenAIClient(config: ResolvedConfig): OpenAI {
    return new OpenAI({
        apiKey: config.apiKey || "sk-no-key",
        baseURL: config.apiBase ?? undefined,
    });
}

function makeAnthropicClient(config: ResolvedConfig): Anthropic {
    return new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.apiBase ?? undefined,
    });
}

// ─── Temperature for Retries ──────────────────────────────────────────────────

function getRetryTemperature(attempt: number): number {
    return [0.1, 0.3, 0.5, 0.7][Math.min(attempt, 3)] ?? 0.7;
}

// ─── Core Complete (Text) ─────────────────────────────────────────────────────

export async function completeText(
    orgId: string,
    prompt: string,
    options: {
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
    } = {}
): Promise<string> {
    const config = await resolveConfig(orgId);
    const { systemPrompt, maxTokens = 4096, temperature = 0.7 } = options;

    if (config.provider === "anthropic") {
        const client = makeAnthropicClient(config);
        const response = await client.messages.create({
            model: config.model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
        });

        const text = response.content
            .filter((b) => b.type === "text")
            .map((b) => (b as { type: "text"; text: string }).text)
            .join("\n")
            .trim();

        if (!text) throw new Error("Empty response from LLM");
        return text.includes("<think>") ? stripThinkingTags(text) : text;
    }

    // OpenAI-compatible (openai, openai_compatible, deepseek, openrouter, ollama, gemini)
    const client = makeOpenAIClient(config);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const extra: Record<string, unknown> = {};
    if (config.reasoningEffort) extra["reasoning_effort"] = config.reasoningEffort;

    const response = await client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...extra,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Empty response from LLM");
    return content.includes("<think>") ? stripThinkingTags(content) : content;
}

// ─── JSON Support Helper ──────────────────────────────────────────────────

function supportsJsonMode(provider: string, model: string): boolean {
    if (provider === "ollama") return true;
    if (provider === "openai_compatible") return false;
    return ["openai", "deepseek"].includes(provider);
}

// ─── Core CompleteJson ────────────────────────────────────────────────────────

export type LlmJsonResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function completeJson<T = Record<string, any>>(
    userId: string,
    prompt: string,
    options: {
        systemPrompt?: string;
        maxTokens?: number;
        retries?: number;
    } = {}
): Promise<LlmJsonResult<T>> {
    const config = await resolveConfig(userId);
    const { maxTokens = 4096, retries = 2 } = options;

    const jsonSystemPrompt =
        (options.systemPrompt ?? "") +
        "\n\nYou must respond with valid JSON only. No explanations, no markdown.";

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            let rawContent: string;

            if (config.provider === "anthropic") {
                const client = makeAnthropicClient(config);
                const response = await client.messages.create({
                    model: config.model,
                    max_tokens: maxTokens,
                    system: jsonSystemPrompt,
                    messages: [{ role: "user", content: prompt }],
                });
                rawContent = response.content
                    .filter((b) => b.type === "text")
                    .map((b) => (b as { type: "text"; text: string }).text)
                    .join("\n");
            } else {
                const client = makeOpenAIClient(config);
                const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                    { role: "system", content: jsonSystemPrompt },
                    { role: "user", content: prompt },
                ];
                const extra: Record<string, unknown> = {};
                if (config.reasoningEffort) extra["reasoning_effort"] = config.reasoningEffort;

                const response = await client.chat.completions.create({
                    model: config.model,
                    messages,
                    max_tokens: maxTokens,
                    temperature: getRetryTemperature(attempt),
                    ...(supportsJsonMode(config.provider, config.model) && {
                        response_format: { type: "json_object" },
                    }),
                    ...extra,
                });
                rawContent = response.choices[0]?.message?.content ?? "";
            }

            if (!rawContent) throw new Error("Empty response from LLM");

            const jsonStr = extractJson(rawContent);
            const result = JSON.parse(jsonStr) as T;

            return { success: true, data: result };
        } catch (err) {
            if (attempt >= retries) {
                const message = err instanceof Error ? err.message : String(err);
                return { success: false, error: scrubApiKeys(message) };
            }
        }
    }

    return { success: false, error: "MAX_RETRIES_EXCEEDED" };
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Checks the connectivity and response health of the configured LLM for an organization.
 * Used by the system health endpoint.
 */
export async function checkLlmHealth(
    orgId: string,
    options: { includeDetails?: boolean; testPrompt?: string } = {}
): Promise<Record<string, unknown>> {
    let config: ResolvedConfig;
    try {
        config = await resolveConfig(orgId);
    } catch {
        return { healthy: false, error_code: "config_load_failed" };
    }

    if (!config.apiKey && config.provider !== "ollama" && config.provider !== "openai_compatible") {
        return { healthy: false, provider: config.provider, model: config.model, error_code: "api_key_missing" };
    }

    const testPrompt = options.testPrompt ?? "Hi";
    try {
        const result = await completeText(orgId, testPrompt, { maxTokens: 64 });
        const res: Record<string, unknown> = {
            healthy: !!result,
            provider: config.provider,
            model: config.model,
        };
        if (options.includeDetails) {
            res["test_prompt"] = testPrompt;
            res["model_output"] = result?.slice(0, 200);
        }
        return res;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const res: Record<string, unknown> = {
            healthy: false,
            provider: config.provider,
            model: config.model,
            error_code: message.includes("404") ? "not_found_404" : "health_check_failed",
        };
        if (options.includeDetails) {
            res["error_detail"] = scrubApiKeys(message);
        }
        return res;
    }
}
