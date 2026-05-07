import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionPlan } from "@/server/subscription";
import { requirePlan, requireRateLimit } from "@/lib/middleware";
import { listResumes, createResumeRecord } from "@/server/resumes";
import { parseResume } from "@/lib/parser";
import { ResumeStatus } from "@prisma/client";
import { authenticate } from "@/lib/api";


export async function GET(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeMaster = searchParams.get("includeMaster") === "true";

    const result = await listResumes(organizationId, includeMaster, { limit, offset });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ data: result.data });
}

export async function POST(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    // Plan gate check
    const { allowed, error: planError } = await requirePlan(organizationId, "FREE"); // Minimum plan
    if (!allowed) return NextResponse.json({ error: planError }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const parseResult = await parseResume(organizationId, buffer, file.name);

        if (!parseResult.success) {
            return NextResponse.json({ error: parseResult.error }, { status: 422 });
        }

        const resumeResult = await createResumeRecord({
            organizationId,
            originalMarkdown: parseResult.data.originalMarkdown,
            structuredData: parseResult.data.structuredData as any,
            filename: file.name,
            status: ResumeStatus.READY,
        });

        if (!resumeResult.success) {
            return NextResponse.json({ error: resumeResult.error }, { status: 500 });
        }

        return NextResponse.json({ data: resumeResult.data }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
    }
}