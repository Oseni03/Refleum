import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { completeText } from "@/lib/llm";
import { COVER_LETTER_PROMPT } from "@/lib/prompts/templates";
import { getResumeById } from "./resumes";

const coverLetterSelect = {
    id: true,
    organizationId: true,
    resumeId: true,
    content: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type CoverLetterRecord = Prisma.CoverLetterGetPayload<{ select: typeof coverLetterSelect }>;

export type ServerActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function getCoverLetterById(
    coverLetterId: string,
    organizationId: string
): Promise<ServerActionResult<CoverLetterRecord>> {
    try {
        const coverLetter = await prisma.coverLetter.findFirst({
            where: { id: coverLetterId, organizationId },
            select: coverLetterSelect,
        });
        if (!coverLetter) return { success: false, error: "NOT_FOUND" };
        return { success: true, data: coverLetter };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function listCoverLetters(
    organizationId: string,
    resumeId?: string,
    params: { limit: number; offset: number } = { limit: 10, offset: 0 }
): Promise<ServerActionResult<CoverLetterRecord[]>> {
    try {
        const coverLetters = await prisma.coverLetter.findMany({
            where: {
                organizationId,
                ...(resumeId ? { resumeId } : {}),
            },
            select: coverLetterSelect,
            orderBy: { updatedAt: "desc" },
            take: params.limit,
            skip: params.offset,
        });
        return { success: true, data: coverLetters };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function createCoverLetterRecord(input: {
    organizationId: string;
    resumeId: string;
    content: string;
}): Promise<ServerActionResult<CoverLetterRecord>> {
    try {
        const result = await prisma.coverLetter.create({
            data: {
                organizationId: input.organizationId,
                resumeId: input.resumeId,
                content: input.content,
            },
            select: coverLetterSelect,
        });
        return { success: true, data: result };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function updateCoverLetterRecord(
    coverLetterId: string,
    organizationId: string,
    content: string
): Promise<ServerActionResult<CoverLetterRecord>> {
    try {
        const existing = await prisma.coverLetter.findFirst({
            where: { id: coverLetterId, organizationId },
            select: { id: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        const result = await prisma.coverLetter.update({
            where: { id: coverLetterId },
            data: { content },
            select: coverLetterSelect,
        });
        return { success: true, data: result };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function deleteCoverLetterRecord(
    coverLetterId: string,
    organizationId: string
): Promise<ServerActionResult<{ success: true }>> {
    try {
        const existing = await prisma.coverLetter.findFirst({
            where: { id: coverLetterId, organizationId },
            select: { id: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        await prisma.coverLetter.delete({ where: { id: coverLetterId } });
        return { success: true, data: { success: true } };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function generateCoverLetter(
    resumeId: string,
    organizationId: string,
    input: { jobDescription: string; outputLanguage?: string }
): Promise<ServerActionResult<CoverLetterRecord>> {
    try {
        const resumeResult = await getResumeById(resumeId, organizationId);
        if (!resumeResult.success) return { success: false, error: "RESUME_NOT_FOUND" };

        const language = input.outputLanguage || "en";

        const content = await completeText(
            organizationId,
            COVER_LETTER_PROMPT
                .replace("{output_language}", language)
                .replace("{job_description}", input.jobDescription)
                .replace("{resume_data}", JSON.stringify(resumeResult.data.structuredData))
        );

        if (!content) return { success: false, error: "LLM_GENERATION_FAILED" };

        return await createCoverLetterRecord({
            organizationId,
            resumeId,
            content,
        });
    } catch (e) {
        return { success: false, error: "COVER_LETTER_PROCESS_FAILED" };
    }
}
