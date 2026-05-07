import { NextRequest, NextResponse } from "next/server";
import { requirePlan, requireRateLimit } from "@/lib/middleware";
import { listCoverLetters, generateCoverLetter } from "@/server/cover-letters";
import { z } from "zod";
import { getSubscriptionPlan, recordUsage } from "@/server/subscription";
import { authenticate } from "@/lib/api";

const generateSchema = z.object({
    resumeId: z.string(),
    jobDescription: z.string().min(50),
    outputLanguage: z.string().optional(),
});

export async function GET(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get("resumeId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await listCoverLetters(organizationId, resumeId, { limit, offset });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ data: result.data });
}

export async function POST(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

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

        const result = await generateCoverLetter(validatedData.resumeId, organizationId, validatedData);
        if (!result.success) {
            const status = result.error === "RESUME_NOT_FOUND" ? 404 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({ data: result.data }, { status: 201 });
    } catch (e) {
        console.error(e);
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: "INVALID_INPUT", details: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: "GENERATION_FAILED" }, { status: 500 });
    }
}
