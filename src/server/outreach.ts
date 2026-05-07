import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
    content: string;
}): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const result = await prisma.outreach.create({
            data: {
                organizationId: input.organizationId,
                resumeId: input.resumeId,
                content: input.content,
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
    content: string
): Promise<ServerActionResult<OutreachRecord>> {
    try {
        const existing = await prisma.outreach.findFirst({
            where: { id: outreachId, organizationId },
            select: { id: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        const result = await prisma.outreach.update({
            where: { id: outreachId },
            data: { content },
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

// Placeholder for Outreach Generation logic
export async function generateOutreach(
    resumeId: string,
    organizationId: string,
    type: "LinkedIn" | "Email"
): Promise<ServerActionResult<OutreachRecord>> {
    // In a real app, this would use LLM logic
    // For now, we simulate a successful generation
    return createOutreachRecord({
        organizationId,
        resumeId,
        content: `Personalized ${type} outreach message based on resume ${resumeId}.`,
    });
}
