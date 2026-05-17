import { prisma } from "@/lib/prisma";
import type { Prisma, ResumeStatus } from "@prisma/client";
import { generateOutreachMessage } from "@/lib/cover-letter";
import { getResumeById } from "./resumes";

const outreachSelect = {
    id: true,
    organizationId: true,
    resumeId: true,
    content: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type OutreachRecord = Prisma.OutreachGetPayload<{ select: typeof outreachSelect }>;

export type ServerActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function getOutreachById(
    outreachId: string,
    organizationId: string
): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const outreach = await prisma.outreach.findFirst({
            where: { id: outreachId, organizationId },
            select: outreachSelect,
        });
        if (!outreach) return { success: false, error: "NOT_FOUND" };
        return { success: true, data: outreach };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function listOutreachMessages(
    organizationId: string,
    resumeId?: string,
    params: { limit: number; offset: number } = { limit: 10, offset: 0 }
): Promise<ServerActionResult<OutreachRecord[]>> {
    try {
        const outreachMessages = await prisma.outreach.findMany({
            where: {
                organizationId,
                ...(resumeId ? { resumeId } : {}),
            },
            select: outreachSelect,
            orderBy: { updatedAt: "desc" },
            take: params.limit,
            skip: params.offset,
        });
        return { success: true, data: outreachMessages };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function createOutreachRecord(input: {
    organizationId: string;
    resumeId: string;
    content?: string;
}): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const result = await prisma.outreach.create({
            data: {
                organizationId: input.organizationId,
                resumeId: input.resumeId,
                ...(input.content !== undefined ? { content: input.content } : {}),
            },
            select: outreachSelect,
        });
        return { success: true, data: result };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function updateOutreachRecord(
    outreachId: string,
    organizationId: string,
    updates: Partial<{ content: string; status: ResumeStatus }>
): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const existing = await prisma.outreach.findFirst({
            where: { id: outreachId, organizationId },
            select: { id: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        const result = await prisma.outreach.update({
            where: { id: outreachId },
            data: updates,
            select: outreachSelect,
        });
        return { success: true, data: result };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

export async function deleteOutreachRecord(
    outreachId: string,
    organizationId: string
): Promise<ServerActionResult<{ success: true }>> {
    try {
        const existing = await prisma.outreach.findFirst({
            where: { id: outreachId, organizationId },
            select: { id: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        await prisma.outreach.delete({ where: { id: outreachId } });
        return { success: true, data: { success: true } };
    } catch (e) {
        return { success: false, error: "INTERNAL_ERROR" };
    }
}

/**
 * Generate an outreach message for a resume using the LLM.
 * A job_description is always required per FR-070.
 */
export async function generateOutreach(
    resumeId: string,
    organizationId: string,
    jobDescription: string,
    outputLanguage = "en"
): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const resumeResult = await getResumeById(resumeId, organizationId);
        if (!resumeResult.success) return { success: false, error: "RESUME_NOT_FOUND" };

        const content = await generateOutreachMessage(
            organizationId,
            resumeResult.data.structuredData as Record<string, unknown>,
            jobDescription,
            outputLanguage
        );

        if (!content) return { success: false, error: "LLM_GENERATION_FAILED" };

        return await createOutreachRecord({ organizationId, resumeId, content });
    } catch (e) {
        return { success: false, error: "OUTREACH_PROCESS_FAILED" };
    }
}

/**
 * Re-generate an outreach message in-place (same record ID).
 * Falls back to the linked resume's stored job_description if no JD is provided.
 */
export async function regenerateOutreach(
    outreachId: string,
    organizationId: string,
    jobDescription?: string
): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const existing = await prisma.outreach.findFirst({
            where: { id: outreachId, organizationId },
            select: { id: true, resumeId: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        const resumeResult = await getResumeById(existing.resumeId, organizationId);
        if (!resumeResult.success) return { success: false, error: "RESUME_NOT_FOUND" };

        const jd = jobDescription ?? resumeResult.data.jobDescription ?? null;
        if (!jd) return { success: false, error: "NO_JOB_DESCRIPTION" };

        const language = resumeResult.data.outputLanguage ?? "en";
        const content = await generateOutreachMessage(
            organizationId,
            resumeResult.data.structuredData as Record<string, unknown>,
            jd,
            language
        );

        if (!content) return { success: false, error: "LLM_GENERATION_FAILED" };

        return await updateOutreachRecord(outreachId, organizationId, { 
            content, 
            status: "READY" 
        });
    } catch (e) {
        return { success: false, error: "REGENERATE_FAILED" };
    }
}
