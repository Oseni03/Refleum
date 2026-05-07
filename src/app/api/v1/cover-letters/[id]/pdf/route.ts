import { NextRequest, NextResponse } from "next/server";
import { requireRateLimit } from "@/lib/middleware";
import { getSubscriptionPlan, recordUsage } from "@/server/subscription";
import { generateCoverLetterPdf } from "@/server/pdf";
import { authenticate } from "@/lib/api";

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

    try {
        // Record Usage (costs 1 pdf_export operation - standardizing)
        await recordUsage(organizationId, "pdf_export");

        const { searchParams } = new URL(req.url);
        const format = (searchParams.get("format") || "A4") as any;

        const pdfBuffer = await generateCoverLetterPdf(id, organizationId, format);

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="cover-letter-${id}.pdf"`,
            },
        });
    } catch (e: any) {
        const status = e.message === "Cover Letter not found" ? 404 : 500;
        return NextResponse.json({ error: e.message || "PDF_GENERATION_FAILED" }, { status });
    }
}
