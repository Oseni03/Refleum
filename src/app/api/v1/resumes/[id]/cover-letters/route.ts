import { NextRequest, NextResponse } from "next/server";
import { listCoverLetters, generateCoverLetter } from "@/server/cover-letters";
import { authenticate, parseBody } from "@/lib/api";
import { requirePlan } from "@/lib/middleware";
import { z } from "zod";

const generateSchema = z.object({
    // Optional — falls back to the resume's stored job_description (FR-060)
    job_description: z.string().optional(),
});

// GET /api/v1/resumes/:id/cover-letters — list cover letters for this resume
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: resumeId } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    // resumeId is now from the URL — no ?resume_id= query param needed
    const result = await listCoverLetters(organizationId, resumeId, { limit, offset });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ data: result.data });
}

// POST /api/v1/resumes/:id/cover-letters — generate a cover letter for this resume
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: resumeId } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    // Plan gate: Starter+ required for AI generation
    const planCheck = await requirePlan(organizationId, "STARTER");
    if (!planCheck.allowed) {
        return NextResponse.json({ error: planCheck.error }, { status: 402 });
    }

    const { data: body, errResponse: bodyErr } = await parseBody(req, generateSchema);
    if (bodyErr) return bodyErr;

    const result = await generateCoverLetter(resumeId, organizationId, { jobDescription: body?.job_description || "" });
    if (!result.success) {
        const status =
            result.error === "NOT_FOUND" ? 404 :
                result.error === "NO_JOB_DESCRIPTION" ? 400 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
}