// API key management — requires an active user SESSION (not an API key).
// Users manage their API keys through the dashboard; these routes are not
// themselves protected by API keys (that would be circular).
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/middleware";
import { apiOk, apiError, parseBody } from "@/lib/api";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const CreateKeySchema = z.object({
    name: z.string().min(1).max(60),
});

/**
 * GET /api/keys
 * List all API keys for the authenticated user.
 * Key values are never returned after creation — only metadata.
 *
 * Auth: session cookie
 * Returns: { data: { keys: ApiKeyMeta[] } }
 */
export async function GET() {
    const { session, error } = await requireSession();
    if (error || !session?.user.id || !session.activeOrganizationId) return apiError("UNAUTHORIZED", 401);

    const result = await auth.api.listApiKeys({
        headers: await headers(),
        query: { organizationId: session.activeOrganizationId }
    });

    const keys = (result.apiKeys ?? []).map((k) => ({
        id: k.id,
        name: k.name,
        created_at: k.createdAt,
        last_used: k.lastRequest ?? null,
    }));

    return apiOk({ keys });
}

/**
 * POST /api/keys
 * Create a new API key for the authenticated user.
 * The full key value is returned ONCE — it cannot be retrieved again.
 *
 * Auth: session cookie
 * Body: { name: string }
 * Returns: { data: { id, name, key } }  ← key is the one-time reveal value
 */
export async function POST(req: NextRequest) {
    const { session, error } = await requireSession();
    if (error || !session?.user.id || !session.activeOrganizationId) return apiError("UNAUTHORIZED", 401);

    const { data: body, errResponse: bodyErr } = await parseBody(req, CreateKeySchema);
    if (bodyErr) return bodyErr;

    const result = await auth.api.createApiKey({
        body: {
            name: body.name,
            userId: session.user.id,
            organizationId: session.activeOrganizationId,
        },
        headers: await headers(),
    });

    // Return 201 — the `key` field is the one-time plain-text value.
    // The UI must enforce that the user copies it before closing the dialog.
    return apiOk(
        { id: result.id, name: result.name, key: result.key },
        201
    );
}