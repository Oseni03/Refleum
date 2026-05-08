import { NextRequest, NextResponse } from "next/server";
import { requireRateLimit } from "@/lib/middleware";
import { getSubscriptionPlan, recordUsage } from "@/server/subscription";
import { listResumes, createResumeRecord } from "@/server/resumes";
import { parseResume, isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@/lib/parser";
import { ResumeStatus } from "@prisma/client";
import { authenticate } from "@/lib/api";

// GET /api/v1/resumes — list resumes (org-scoped, paginated)
// ?include_master=true  → include master resume in results (default false, FR-091)
export async function GET(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    // PRD uses snake_case query param (FR-091): ?include_master=true
    const includeMaster = searchParams.get("include_master") === "true";

    const result = await listResumes(organizationId, includeMaster, { limit, offset });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ data: result.data });
}

export async function POST(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const plan = await getSubscriptionPlan(organizationId);
    const rateLimit = await requireRateLimit(organizationId, plan);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", detail: "Missing 'file' in form data" },
                { status: 422 }
            );
        }

        // FR-001 — size gate (4 MB)
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", detail: "File exceeds 4 MB limit" },
                { status: 422 }
            );
        }

        // FR-001 — MIME type gate
        if (!isAllowedMimeType(file.type)) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", detail: "Only PDF and DOCX files are accepted" },
                { status: 422 }
            );
        }

        // FR-005 — set_as_master flag
        const setAsMaster = formData.get("set_as_master");
        const explicitMaster =
            setAsMaster === "true" ? true :
                setAsMaster === "false" ? false :
                    undefined; // undefined → auto-designate per FR-005

        const buffer = Buffer.from(await file.arrayBuffer());

        // FR-002/FR-003 — convert to Markdown + LLM parse
        const parseResult = await parseResume(organizationId, buffer, file.name);

        let status: ResumeStatus;
        let structuredData: Record<string, unknown>;
        let originalMarkdown: string;

        if (parseResult.success) {
            status = ResumeStatus.READY;
            structuredData = parseResult.data.structuredData;
            originalMarkdown = parseResult.data.originalMarkdown;
        } else {
            // FR-004 — persist as failed; resume_id is still returned
            status = ResumeStatus.FAILED;
            structuredData = {};
            // For a failed parse, we still need the markdown if possible
            // parseResume fails before markdown when the document is unreadable
            originalMarkdown = "";
        }

        // FR-008 — originalMarkdown is immutable; set once here
        const saveResult = await createResumeRecord({
            organizationId,
            originalMarkdown,
            structuredData: structuredData as any,
            filename: file.name,
            status,
            isMaster: explicitMaster,
        });

        if (!saveResult.success) {
            return NextResponse.json({ error: saveResult.error }, { status: 500 });
        }

        // Record usage for metering
        await recordUsage(organizationId, "parse", saveResult.data.id);

        // FR-009 — response shape
        return NextResponse.json(
            {
                data: {
                    resume_id: saveResult.data.id,
                    is_master: saveResult.data.isMaster,
                    status: saveResult.data.status,
                    filename: saveResult.data.filename,
                },
            },
            { status: 201 }
        );
    } catch (e: any) {
        return NextResponse.json(
            { error: "INTERNAL_ERROR", detail: e?.message ?? "Upload failed" },
            { status: 500 }
        );
    }
}