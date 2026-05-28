import { type NextRequest } from "next/server";
import { authenticate, apiOk, apiError, parseBody, LlmConfigSchema } from "@/lib/api";
import { getLlmConfig, updateLlmConfig } from "@/server/llm-config";

/**
 * GET /api/v1/llm-config
 * Returns the caller's LLM configuration (API key is masked).
 * Returns: { data: LlmConfigPayload }
 */
export async function GET(req: NextRequest) {
    const { ownerId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const config = await getLlmConfig(ownerId);
    return apiOk(config);
}

/**
 * PUT /api/v1/llm-config
 * Update LLM provider, model, API key, and feature flags.
 * Omit a field to leave it unchanged.
 *
 * Body: Partial<LlmConfigPayload>  (apiKey = raw key, not masked)
 * Returns: { data: { message } }
 */
export async function PUT(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const { data: body, errResponse: bodyErr } = await parseBody(req, LlmConfigSchema);
    if (bodyErr) return bodyErr;

    // Normalize: empty string reasoningEffort → null (user explicitly cleared it)
    const updates = {
        ...body,
        reasoningEffort: body.reasoningEffort === "" ? null : body.reasoningEffort,
    };

    const result = await updateLlmConfig(organizationId, updates);
    if (!result.success) return apiError("INTERNAL_ERROR", 500);

    return apiOk({ message: "Settings updated" });
}