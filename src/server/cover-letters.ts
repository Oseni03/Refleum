import { prisma } from "@/lib/prisma";
import type { Prisma, ResumeStatus } from "@prisma/client";
import { generateCoverLetter as generateCoverLetterText } from "@/lib/cover-letter";
import { getResumeById } from "./resumes";
import { ApiErrorCode } from "@/lib/api";

const coverLetterSelect = {
	id: true,
	organizationId: true,
	resumeId: true,
	content: true,
	createdAt: true,
	updatedAt: true,
} as const;

export type CoverLetterRecord = Prisma.CoverLetterGetPayload<{
	select: typeof coverLetterSelect;
}>;

export type ServerActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: ApiErrorCode };

export async function getCoverLetterById(
	resumeId: string,
	coverLetterId: string,
	organizationId: string,
): Promise<ServerActionResult<CoverLetterRecord>> {
	try {
		const coverLetter = await prisma.coverLetter.findFirst({
			where: { id: coverLetterId, organizationId, resumeId },
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
	params: { limit: number; offset: number } = { limit: 10, offset: 0 },
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
	content?: string;
}): Promise<ServerActionResult<CoverLetterRecord>> {
	try {
		const result = await prisma.coverLetter.create({
			data: {
				organizationId: input.organizationId,
				resumeId: input.resumeId,
				...(input.content !== undefined
					? { content: input.content }
					: {}),
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
	updates: Partial<{ content: string; status: ResumeStatus }>,
): Promise<ServerActionResult<CoverLetterRecord>> {
	try {
		const existing = await prisma.coverLetter.findFirst({
			where: { id: coverLetterId, organizationId },
			select: { id: true },
		});
		if (!existing) return { success: false, error: "NOT_FOUND" };

		const result = await prisma.coverLetter.update({
			where: { id: coverLetterId },
			data: updates,
			select: coverLetterSelect,
		});
		return { success: true, data: result };
	} catch (e) {
		return { success: false, error: "INTERNAL_ERROR" };
	}
}

export async function deleteCoverLetterRecord(
	resumeId: string,
	coverLetterId: string,
	organizationId: string,
): Promise<ServerActionResult<{ success: true }>> {
	try {
		const existing = await prisma.coverLetter.findFirst({
			where: { id: coverLetterId, organizationId, resumeId },
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
	input: { jobDescription: string; outputLanguage?: string },
): Promise<ServerActionResult<CoverLetterRecord>> {
	try {
		const resumeResult = await getResumeById(resumeId, organizationId);
		if (!resumeResult.success)
			return { success: false, error: "RESUME_NOT_FOUND" };

		const language = input.outputLanguage ?? "en";
		const content = await generateCoverLetterText(
			organizationId,
			resumeResult.data.structuredData as Record<string, unknown>,
			input.jobDescription || resumeResult.data.jobDescription || "",
			language,
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

/**
 * Re-generate a cover letter in-place (same record ID).
 * Falls back to the linked resume's stored job_description if no JD is provided.
 */
export async function regenerateCoverLetter(
	resumeId: string,
	coverLetterId: string,
	organizationId: string,
	jobDescription?: string,
): Promise<ServerActionResult<CoverLetterRecord>> {
	try {
		const result = await prisma.coverLetter.findFirst({
			where: { id: coverLetterId, organizationId, resumeId },
			include: {
				resume: true,
			},
		});
		if (!result) return { success: false, error: "NOT_FOUND" };

		const jd = jobDescription ?? result.resume.jobDescription ?? null;
		if (!jd) return { success: false, error: "NO_JOB_DESCRIPTION" };

		const language = result.resume.outputLanguage ?? "en";
		const content = await generateCoverLetterText(
			organizationId,
			result.resume.structuredData as Record<string, unknown>,
			jd,
			language,
		);

		if (!content) return { success: false, error: "LLM_GENERATION_FAILED" };

		return await updateCoverLetterRecord(coverLetterId, organizationId, {
			content,
			status: "READY", // Explicitly set to READY after background generation
		});
	} catch (e) {
		return { success: false, error: "REGENERATE_FAILED" };
	}
}
