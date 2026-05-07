import { NextRequest, NextResponse } from "next/server";
import { requireRateLimit, requirePlan } from "@/lib/middleware";
import { getSubscriptionPlan, recordUsage } from "@/server/subscription";
import { listOutreachMessages, generateOutreach } from "@/server/outreach";
import { z } from "zod";
import { authenticate } from "@/lib/api";

const generateSchema = z.object({
    resumeId: z.string().min(1),
    type: z.enum(["LinkedIn", "Email"]),
});

export async function GET(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const result = await listOutreachMessages(organizationId);
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
}

export async function POST(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse || !organizationId) {
        return NextResponse.json({ error: "NOT_AUTHORIZED" }, { status: 401 });
    }

    const plan = await getSubscriptionPlan(organizationId);

    // Check Plan Requirement (PRO/ENTERPRISE)
    const planCheck = await requirePlan(organizationId, "PRO");
    if (!planCheck.allowed) {
        return NextResponse.json({ error: planCheck.error }, { status: 403 });
    }

    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    try {
        const body = await req.json();
        const validatedData = generateSchema.parse(body);

        // Record Usage
        await recordUsage(organizationId, "tailor", validatedData.resumeId);

        const result = await generateOutreach(
            validatedData.resumeId,
            organizationId,
            validatedData.type
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ data: result.data }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
