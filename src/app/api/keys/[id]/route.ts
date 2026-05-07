import { type NextRequest } from "next/server";
import { requireSession } from "@/lib/middleware";
import { apiOk, apiError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/keys/:id
 * Revoke an API key permanently.
 * Verified against the authenticated user — cannot revoke another user's key.
 *
 * Auth: session cookie
 * Returns: { data: { message } }
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { session, error } = await requireSession();
    if (error) return apiError("UNAUTHORIZED", 401);

    const { id } = await params;

    // Verify ownership before revoking: list the user's keys and confirm the
    // target key belongs to them. This prevents a logged-in user from revoking
    // another user's key by guessing an ID.
    const allKeys = await (
        auth.api as unknown as {
            listApiKeys: (opts: { headers: Headers }) => Promise<Array<{ id: string; referenceId: string }>>;
        }
    ).listApiKeys({ headers: await headers() });

    const ownedKey = (allKeys ?? []).find(
        (k) => k.id === id && k.referenceId === session?.activeOrganizationId
    );

    if (!ownedKey) return apiError("NOT_FOUND", 404, "API key not found");

    await (
        auth.api as unknown as {
            revokeApiKey: (opts: { body: { keyId: string }; headers: Headers }) => Promise<void>;
        }
    ).revokeApiKey({ body: { keyId: id }, headers: await headers() });

    return apiOk({ message: "API key revoked" });
}