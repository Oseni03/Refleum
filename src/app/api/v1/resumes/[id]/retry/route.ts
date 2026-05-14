import { NextRequest, NextResponse } from "next/server";
import { retryResumeParsing } from "@/server/resumes";
import { authenticate } from "@/lib/api";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const result = await retryResumeParsing(id, organizationId);
    if (!result.success) {
        const status = result.error === "NOT_FOUND" ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
}
