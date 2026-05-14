import { NextRequest, NextResponse } from "next/server";
import { listOutreachMessages } from "@/server/outreach";
import { authenticate } from "@/lib/api";

// GET /api/v1/outreach — list outreach messages (org-scoped, paginated)
// ?resume_id=  optional filter by resume
// Outreach messages are created at tailor-time or via /regenerate — no standalone POST.
export async function GET(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get("resume_id") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const result = await listOutreachMessages(organizationId, resumeId, { limit, offset });
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
}
