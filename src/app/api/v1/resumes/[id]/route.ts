import { NextRequest, NextResponse } from "next/server";
import { requireRateLimit } from "@/lib/middleware";
import { getSubscriptionPlan } from "@/server/subscription";
import { getResumeById, updateResumeRecord, deleteResumeRecord } from "@/server/resumes";
import { z } from "zod";
import { ResumeStatus } from "@prisma/client";
import { authenticate } from "@/lib/api";

const updateSchema = z.object({
    title: z.string().optional(),
    structuredData: z.any().optional(),
    status: z.enum(ResumeStatus).optional(),
    filename: z.string().optional(),
});

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

    const result = await getResumeById(id, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}

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

    try {
        const body = await req.json();
        const validated = updateSchema.parse(body);

        const result = await updateResumeRecord(id, organizationId, validated);
        if (!result.success) {
            const status = result.error === "NOT_FOUND" ? 404 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({ data: result.data });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: "INVALID_INPUT", details: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
    }
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

    const result = await deleteResumeRecord(id, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: { success: true } });
}