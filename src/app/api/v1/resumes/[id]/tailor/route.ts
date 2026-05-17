import { NextRequest, NextResponse, after } from "next/server";
import { requirePlan } from "@/lib/middleware";
import { tailorResume } from "@/server/resumes";
import { TailorStrategy } from "@prisma/client";
import { z } from "zod";
import { authenticate, parseBody, tailorSchema } from "@/lib/api";
import { recordUsage } from "@/server/subscription";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    // Plan gate check for tailoring
    const { allowed, error: planError } = await requirePlan(organizationId, "STARTER");
    if (!allowed) return NextResponse.json({ error: planError }, { status: 403 });

    try {
        const { data: body, errResponse: bodyErr } = await parseBody(req, tailorSchema);
        if (bodyErr) return bodyErr;

        // Tailoring itself still runs in-request for now as it produces the new resume record
        const result = await tailorResume(organizationId, {
            resumeId: id,
            jobDescription: body.jobDescription,
            strategy: body.strategy?.toUpperCase() as TailorStrategy,
            outputLanguage: body.outputLanguage?.toLowerCase(),
            generateCoverLetter: body.generateCoverLetter,
            generateOutreach: body.generateOutreach,
        });

        if (!result.success) {
            if (result.error === "NO_MASTER_RESUME") {
                return NextResponse.json(
                    { error: "VALIDATION_ERROR", detail: "No master resume found. Provide resume_id or upload a master resume." },
                    { status: 400 }
                );
            }
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        const data = result.data;

        // Phase 2: Background Generation of Cover Letter & Outreach
        after(async () => {
            try {
                // Record usage for the tailoring operation
                await recordUsage(organizationId, "tailor", id);

                if (data.cover_letter_id) {
                    const { regenerateCoverLetter, updateCoverLetterRecord } = await import("@/server/cover-letters");
                    const clResult = await regenerateCoverLetter(data.cover_letter_id, organizationId, body.jobDescription);
                    if (!clResult.success) {
                        await updateCoverLetterRecord(data.cover_letter_id, organizationId, { status: "FAILED" });
                    }
                }

                if (data.outreach_id) {
                    const { regenerateOutreach, updateOutreachRecord } = await import("@/server/outreach");
                    const outResult = await regenerateOutreach(data.outreach_id, organizationId, body.jobDescription);
                    if (!outResult.success) {
                        await updateOutreachRecord(data.outreach_id, organizationId, { status: "FAILED" });
                    }
                }
            } catch (err) {
                console.error("Background tailoring tasks failed:", err);
            }
        });

        return NextResponse.json(
            {
                data: {
                    resume_id: data.resume.id,
                    is_master: data.resume.isMaster,
                    status: data.resume.status,
                    filename: data.resume.filename,
                    strategy: data.resume.strategy,
                    job_keywords: data.resume.jobKeywords,
                    parent_id: data.resume.parentId,
                    cover_letter_id: data.cover_letter_id,
                    outreach_id: data.outreach_id,
                    refinement_stats: data.refinement_stats,
                },
            },
            { status: 201 }
        );
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: "INVALID_INPUT", details: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: "TAILORING_FAILED" }, { status: 500 });
    }
}
