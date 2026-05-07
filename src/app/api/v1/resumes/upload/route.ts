import { NextRequest, NextResponse } from "next/server";
import { createResumeRecord } from "@/server/resumes";
import { ResumeStatus } from "@prisma/client";
import { authenticate } from "@/lib/api";

export async function POST(req: NextRequest) {
    const { ownerId: organizationId, errResponse } = await authenticate(req);
    if (errResponse) return errResponse;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", message: "Missing file in formData" } },
                { status: 422 }
            );
        }

        const content = await file.text();

        const result = await createResumeRecord({
            organizationId,
            originalMarkdown: content,
            filename: file.name,
            status: ResumeStatus.PENDING,
            structuredData: {
                name: "",
                email: "",
                phone: "",
                summary: "",
                experience: [],
                education: [],
                skills: [],
                projects: [],
                certifications: [],
                languages: [],
                interests: [],
            }
        });

        return NextResponse.json({ data: result });
    } catch (err: any) {
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: err.message } },
            { status: 500 }
        );
    }
}
