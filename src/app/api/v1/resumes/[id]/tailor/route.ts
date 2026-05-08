import { NextRequest, NextResponse } from "next/server";
import { requirePlan } from "@/lib/middleware";
import { tailorResume } from "@/server/resumes";
import { TailorStrategy } from "@prisma/client";
import { z } from "zod";
import { authenticate, parseBody } from "@/lib/api";
import { recordUsage } from "@/server/subscription";

const tailorSchema = z.object({
    jobDescription: z.string().min(50),
    strategy: z.enum(TailorStrategy).optional(),
    generate_cover_letter: z.boolean().optional().default(false), // FR-021/FR-027
    generate_outreach: z.boolean().optional().default(false),    // FR-021/FR-028
    outputLanguage: z.string().optional(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    // Plan gate check for tailoring
    const { allowed, error: planError } = await requirePlan(organizationId, "STARTER"); // Tailoring requires PRO plan in PRD
    if (!allowed) return NextResponse.json({ error: planError }, { status: 403 });

    try {
        const { data: body, errResponse: bodyErr } = await parseBody(req, tailorSchema);
        if (bodyErr) return bodyErr;

        // FR-032 — record usage regardless of pipeline success
        const usagePromise = recordUsage(organizationId, "tailor", id).catch(() => { });

        // FR-031 — 240s hard timeout
        const timeoutMs = 240_000;
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), timeoutMs)
        );

        const tailorPromise = tailorResume(organizationId, {
            resumeId: id, jobDescription: body.jobDescription,
            strategy: body.strategy as TailorStrategy,
            outputLanguage: body.outputLanguage,
            generateCoverLetter: body.generate_cover_letter,
            generateOutreach: body.generate_outreach,
        });

        const [result] = await Promise.all([
            Promise.race([tailorPromise, timeoutPromise]),
            usagePromise,
        ]);

        // Timed out
        if (!result) {
            return NextResponse.json({ error: "TIMEOUT" }, { status: 504 });
        }

        if (!result.success) {
            // FR-022 — no master resume found
            if (result.error === "NO_MASTER_RESUME") {
                return NextResponse.json(
                    { error: "VALIDATION_ERROR", detail: "No master resume found. Provide resume_id or upload a master resume." },
                    { status: 400 }
                );
            }
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(
            {
                data: {
                    resume_id: result.data.resume.id,
                    is_master: result.data.resume.isMaster,
                    status: result.data.resume.status,
                    filename: result.data.resume.filename,
                    strategy: result.data.resume.strategy,
                    job_keywords: result.data.resume.jobKeywords,
                    parent_id: result.data.resume.parentId,
                    cover_letter_id: result.data.cover_letter_id,
                    outreach_id: result.data.outreach_id,
                    refinement_stats: result.data.refinement_stats,
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
