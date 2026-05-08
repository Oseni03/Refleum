import { NextRequest, NextResponse } from "next/server";
import { requireRateLimit } from "@/lib/middleware";
import { getSubscriptionPlan } from "@/server/subscription";
import { getCoverLetterById, deleteCoverLetterRecord, updateCoverLetterRecord } from "@/server/cover-letters";
import { authenticate, parseBody, UpdateCoverLetterSchema } from "@/lib/api";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const result = await getCoverLetterById(id, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}

// PATCH /api/v1/cover-letters/{id} — manually replace content (FR-063). No LLM call.
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const { data: body, errResponse: bodyErr } = await parseBody(req, UpdateCoverLetterSchema);
    if (bodyErr) return bodyErr;

    const result = await updateCoverLetterRecord(id, organizationId, body.content);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const result = await deleteCoverLetterRecord(id, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: { success: true } });
}
