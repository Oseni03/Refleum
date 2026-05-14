import { NextRequest, NextResponse } from "next/server";
import { generateResumePdf } from "@/server/pdf";
import { authenticate } from "@/lib/api";
import { recordUsage } from "@/server/subscription";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    try {
        const { searchParams } = new URL(req.url);
        const format = (searchParams.get("format") || "A4") as any;

        const pdfBuffer = await generateResumePdf(id, organizationId, format);

        // Record Usage (costs 1 pdf_export operation - standardizing)
        await recordUsage(organizationId, "pdf_export");

        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="resume-${id}.pdf"`,
            },
        });
    } catch (e: any) {
        const status = e.message === "Resume not found" ? 404 : 503;
        return NextResponse.json({ error: e.message || "PDF_GENERATION_FAILED" }, { status });
    }
}
