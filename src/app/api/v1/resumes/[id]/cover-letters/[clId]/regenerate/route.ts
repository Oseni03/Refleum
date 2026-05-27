import { NextRequest, NextResponse } from "next/server";
import { regenerateCoverLetter } from "@/server/cover-letters";
import { authenticate, parseBody } from "@/lib/api";
import { requirePlan } from "@/lib/middleware";
import { z } from "zod";

const regenerateSchema = z.object({
    // Optional — falls back to the linked resume's stored job_description (FR-064)
    job_description: z.string().optional(),
});

// POST /api/v1/resumes/:id/cover-letters/:clId/regenerate — AI regenerate in-place (FR-064)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; clId: string }> }
) {
    const { id: resumeId, clId } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    // Plan gate: Starter+ required for AI regeneration
    const planCheck = await requirePlan(organizationId, "STARTER");
    if (!planCheck.allowed) {
        return NextResponse.json({ error: planCheck.error }, { status: 402 });
    }

    const { data: body, errResponse: bodyErr } = await parseBody(req, regenerateSchema);
    if (bodyErr) return bodyErr;

    // Updates the record in-place — same clId returned (FR-064)
    const result = await regenerateCoverLetter(resumeId, clId, organizationId, body?.job_description);
    if (!result.success) {
        const status =
            result.error === "NOT_FOUND" ? 404 :
                result.error === "NO_JOB_DESCRIPTION" ? 400 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}