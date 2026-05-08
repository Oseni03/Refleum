import { NextRequest, NextResponse } from "next/server";
import { requirePlan, requireRateLimit } from "@/lib/middleware";
import { getSubscriptionPlan } from "@/server/subscription";
import { regenerateCoverLetter } from "@/server/cover-letters";
import { authenticate, parseBody } from "@/lib/api";
import { z } from "zod";

const regenerateSchema = z.object({
    job_description: z.string().optional(), // FR-064 — optional, falls back to linked resume's JD
});

// POST /api/v1/cover-letters/{id}/regenerate — AI regenerate in-place (FR-064)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);

    // Plan gate: Starter+ required for AI regeneration
    const planCheck = await requirePlan(organizationId, "STARTER");
    if (!planCheck.allowed) {
        return NextResponse.json({ error: planCheck.error }, { status: 403 });
    }

    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    // Body is optional (no body = fall back to stored JD)
    let jobDescription: string | undefined;
    try {
        const body = await req.json().catch(() => ({}));
        const parsed = regenerateSchema.safeParse(body);
        if (parsed.success) jobDescription = parsed.data.job_description;
    } catch {
        // ignore malformed body — fall back to stored JD
    }

    const result = await regenerateCoverLetter(id, organizationId, jobDescription);
    if (!result.success) {
        const status =
            result.error === "NOT_FOUND" ? 404 :
            result.error === "NO_JOB_DESCRIPTION" ? 400 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}
