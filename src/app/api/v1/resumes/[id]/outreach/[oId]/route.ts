import { NextRequest, NextResponse } from "next/server";
import { getOutreachById, deleteOutreachRecord } from "@/server/outreach";
import { authenticate } from "@/lib/api";

// GET /api/v1/resumes/:id/outreaches/:oId
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; oId: string }> }
) {
    const { id: resumeId, oId } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    // organizationId scopes the lookup — no cross-tenant access possible
    const result = await getOutreachById(oId, resumeId, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}

// DELETE /api/v1/resumes/:id/outreaches/:oId
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; oId: string }> }
) {
    const { id: resumeId, oId } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const result = await deleteOutreachRecord(oId, resumeId, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: { success: true } });
}