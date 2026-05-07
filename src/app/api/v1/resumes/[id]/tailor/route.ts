import { NextRequest, NextResponse } from "next/server";
import { requirePlan } from "@/lib/middleware";
import { tailorResume } from "@/server/resumes";
import { TailorStrategy } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "@/lib/api";

const tailorSchema = z.object({
    jobDescription: z.string().min(50),
    strategy: z.enum(TailorStrategy).optional(),
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
    const { allowed, error: planError } = await requirePlan(organizationId, "PRO"); // Tailoring requires PRO plan in PRD
    if (!allowed) return NextResponse.json({ error: planError }, { status: 403 });

    try {
        const body = await req.json();
        const validated = tailorSchema.parse(body);

        const result = await tailorResume(id, organizationId, validated);
        if (!result.success) {
            const status = result.error === "NOT_FOUND" ? 404 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({ data: result.data });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: "INVALID_INPUT", details: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: "TAILORING_FAILED" }, { status: 500 });
    }
}
