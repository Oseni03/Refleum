import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateCoverLetter as generateCoverLetterText } from "@/lib/cover-letter";
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

        const language = input.outputLanguage ?? "en";
        const content = await generateCoverLetterText(
            organizationId,
            resumeResult.data.structuredData as Record<string, unknown>,
            input.jobDescription,
            language
        );

        if (!content) return { success: false, error: "LLM_GENERATION_FAILED" };

        return await createCoverLetterRecord({ organizationId, resumeId, content });
    } catch (e) {
        return { success: false, error: "COVER_LETTER_PROCESS_FAILED" };
    }
}

/**
 * Re-generate a cover letter in-place (same record ID).
 * Falls back to the linked resume's stored job_description if no JD is provided.
 */
export async function regenerateCoverLetter(
    coverLetterId: string,
    organizationId: string,
    jobDescription?: string
): Promise<ServerActionResult<CoverLetterRecord>> {
    try {
        const existing = await prisma.coverLetter.findFirst({
            where: { id: coverLetterId, organizationId },
            select: { id: true, resumeId: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        const resumeResult = await getResumeById(existing.resumeId, organizationId);
        if (!resumeResult.success) return { success: false, error: "RESUME_NOT_FOUND" };

        const jd = jobDescription ?? resumeResult.data.jobDescription ?? null;
        if (!jd) return { success: false, error: "NO_JOB_DESCRIPTION" };

        const language = resumeResult.data.outputLanguage ?? "en";
        const content = await generateCoverLetterText(
            organizationId,
            resumeResult.data.structuredData as Record<string, unknown>,
            jd,
            language
        );

        if (!content) return { success: false, error: "LLM_GENERATION_FAILED" };

        return await updateCoverLetterRecord(coverLetterId, organizationId, content);
    } catch (e) {
        return { success: false, error: "REGENERATE_FAILED" };
    }
}
