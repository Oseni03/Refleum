import { NextRequest, NextResponse, after } from "next/server";
import { recordUsage } from "@/server/subscription";
import { listResumes, createResumeRecord, updateResumeRecord } from "@/server/resumes";
import { extractTextFromDocument, parseResumeToJson, isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@/lib/parser";
import { ResumeStatus } from "@prisma/client";
import { authenticate } from "@/lib/api";

// GET /api/v1/resumes — list resumes (org-scoped, paginated)
// ?include_master=true  → include master resume in results (default false, FR-091)
export async function GET(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const includeMaster = searchParams.get("include_master") === "true";

    const result = await listResumes(organizationId, includeMaster, { limit, offset });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ data: result.data });
}

export async function POST(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", detail: "Missing 'file' in form data" },
                { status: 422 }
            );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "PAYLOAD_TOO_LARGE", detail: "File size exceeds the 10 MB limit" },
                { status: 413 }
            );
        }

        if (!isAllowedMimeType(file.type)) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", detail: "Only PDF and DOCX files are accepted" },
                { status: 422 }
            );
        }

        const setAsMaster = formData.get("set_as_master");
        const explicitMaster =
            setAsMaster === "true" ? true :
                setAsMaster === "false" ? false :
                    undefined;

        const buffer = Buffer.from(await file.arrayBuffer());

        // Phase 1: Fast Text Extraction (Synchronous)
        const extractResult = await extractTextFromDocument(buffer, file.name);

        if (!extractResult.success) {
            return NextResponse.json({ error: extractResult.error }, { status: 422 });
        }

        const { markdown, html } = extractResult.data;

        // Create record as PROCESSING
        const saveResult = await createResumeRecord({
            organizationId,
            markdown,
            html,
            structuredData: {},
            filename: file.name,
            status: ResumeStatus.PROCESSING,
            isMaster: explicitMaster,
        });

        if (!saveResult.success) {
            return NextResponse.json({ error: saveResult.error }, { status: 500 });
        }

        const resume = saveResult.data;

        // Phase 2: Heavy LLM Parsing (Asynchronous)
        after(async () => {
            try {
                const structuredData = await parseResumeToJson(organizationId, markdown);
                await updateResumeRecord(resume.id, organizationId, {
                    structuredData: structuredData as any,
                    status: ResumeStatus.READY,
                });

                // Record usage only after successful parse
                await recordUsage(organizationId, "parse", resume.id);
            } catch (err: any) {
                console.error(`Background parse failed for ${resume.id}:`, err);
                await updateResumeRecord(resume.id, organizationId, {
                    status: ResumeStatus.FAILED,
                });
            }
        });

        return NextResponse.json(
            {
                data: {
                    resume_id: resume.id,
                    is_master: resume.isMaster,
                    status: resume.status,
                    filename: resume.filename,
                    warnings: [],
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