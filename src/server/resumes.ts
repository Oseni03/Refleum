import { prisma } from "@/lib/prisma";
import { Prisma, ResumeStatus, TailorStrategy } from "@prisma/client";
import { completeJson, completeText } from "@/lib/llm";
import {
	PARSE_RESUME_PROMPT,
	EXTRACT_KEYWORDS_PROMPT,
	IMPROVE_RESUME_PROMPTS,
	CRITICAL_TRUTHFULNESS_RULES,
	RESUME_SCHEMA_EXAMPLE,
	IMPROVE_SCHEMA_EXAMPLE,
} from "@/lib/prompts/templates";
import { ResumeData, RefinementWarning } from "@/types/resume";
import { refineResume } from "@/lib/refiner";
import { restoreDatesFromMarkdown } from "@/lib/resume-utils";
import { cacheResumePdf, generatePdfFromHtml } from "@/server/pdf";

// Shared select shape
const resumeSelect = {
	id: true,
	organizationId: true,
	isMaster: true,
	parentId: true,
	status: true,
	filename: true,
	markdown: true,
	html: true,
	structuredData: true,
	jobDescription: true,
	jobKeywords: true,
	strategy: true,
	title: true,
	outputLanguage: true,
	warnings: true,
	createdAt: true,
	updatedAt: true,
} as const;

export const resumeListSelect = {
	id: true,
	organizationId: true,
	isMaster: true,
	parentId: true,
	status: true,
	filename: true,
	jobDescription: true,
	jobKeywords: true,
	strategy: true,
	title: true,
	outputLanguage: true,
	createdAt: true,
	updatedAt: true,
} as const;

export type ResumeRecord = Prisma.ResumeGetPayload<{
	select: typeof resumeSelect;
}>;
export type ResumeListRecord = Prisma.ResumeGetPayload<{
	select: typeof resumeListSelect;
}>;

export type ServerActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export async function getResumeById(
	resumeId: string,
	organizationId: string,
): Promise<ServerActionResult<ResumeRecord>> {
	try {
		const resume = await prisma.resume.findFirst({
			where: { id: resumeId, organizationId },
			select: resumeSelect,
		});
		if (!resume) return { success: false, error: "NOT_FOUND" };
		return { success: true, data: resume };
	} catch (e) {
		return { success: false, error: "INTERNAL_ERROR" };
	}
}

export async function listResumes(
	organizationId: string,
	includeMaster = false,
	params: { limit: number; offset: number } = { limit: 10, offset: 0 },
): Promise<ServerActionResult<ResumeListRecord[]>> {
	try {
		const resumes = await prisma.resume.findMany({
			where: {
				organizationId,
				...(includeMaster ? {} : { isMaster: false }),
			},
			select: resumeListSelect,
			orderBy: { updatedAt: "desc" },
			take: params.limit,
			skip: params.offset,
		});
		return { success: true, data: resumes };
	} catch (e) {
		return { success: false, error: "INTERNAL_ERROR" };
	}
}

export async function createResumeRecord(input: {
	organizationId: string;
	markdown: string;
	html: string;
	structuredData: Prisma.InputJsonValue;
	filename: string;
	status: ResumeStatus;
	isMaster?: boolean;
	parentId?: string;
	jobDescription?: string;
	jobKeywords?: Prisma.InputJsonValue;
	strategy?: TailorStrategy;
	title?: string;
	outputLanguage?: string;
}): Promise<ServerActionResult<ResumeRecord>> {
	try {
		const shouldBeMaster =
			input.isMaster ??
			!(await prisma.resume.findFirst({
				where: { organizationId: input.organizationId, isMaster: true },
				select: { id: true },
			}));

		if (shouldBeMaster) {
			const result = await prisma.$transaction(async (tx) => {
				await tx.resume.updateMany({
					where: {
						organizationId: input.organizationId,
						isMaster: true,
					},
					data: { isMaster: false },
				});
				return tx.resume.create({
					data: {
						...input,
						isMaster: true,
					},
					select: resumeSelect,
				});
			});
			return { success: true, data: result };
		}

		const result = await prisma.resume.create({
			data: {
				...input,
				isMaster: false,
			},
			select: resumeSelect,
		});
		return { success: true, data: result };
	} catch (e) {
		return { success: false, error: "INTERNAL_ERROR" };
	}
}

export async function updateResumeRecord(
	resumeId: string,
	organizationId: string,
	updates: Partial<{
		structuredData: Prisma.InputJsonValue;
		status: ResumeStatus;
		title: string;
		filename: string;
	}>,
): Promise<ServerActionResult<ResumeRecord>> {
	try {
		const existing = await prisma.resume.findFirst({
			where: { id: resumeId, organizationId },
			select: { id: true },
		});
		if (!existing) return { success: false, error: "NOT_FOUND" };

		const result = await prisma.resume.update({
			where: { id: resumeId, organizationId },
			data: updates,
			select: resumeSelect,
		});
		return { success: true, data: result };
	} catch (e) {
		return { success: false, error: "INTERNAL_ERROR" };
	}
}

export async function deleteResumeRecord(
	resumeId: string,
	organizationId: string,
): Promise<ServerActionResult<{ success: true }>> {
	try {
		const existing = await prisma.resume.findFirst({
			where: { id: resumeId, organizationId },
			select: { id: true },
		});
		if (!existing) return { success: false, error: "NOT_FOUND" };

		await prisma.resume.delete({ where: { id: resumeId } });
		return { success: true, data: { success: true } };
	} catch (e) {
		return { success: false, error: "INTERNAL_ERROR" };
	}
}

export async function retryResumeParsing(
	resumeId: string,
	organizationId: string,
): Promise<ServerActionResult<ResumeRecord>> {
	const resume = await getResumeById(resumeId, organizationId);
	if (!resume.success) return resume;

	if (!resume.data.markdown) {
		return { success: false, error: "MISSING_SOURCE_TEXT" };
	}

	try {
		const parsedResult = await completeJson<ResumeData>(
			organizationId,
			PARSE_RESUME_PROMPT.replace(
				"{schema}",
				RESUME_SCHEMA_EXAMPLE,
			).replace("{resume_text}", resume.data.markdown),
		);

		if (!parsedResult.success)
			return { success: false, error: "LLM_PARSING_FAILED" };

		const restored = restoreDatesFromMarkdown(
			parsedResult.data as Record<string, any>,
			resume.data.markdown,
		);

		return await updateResumeRecord(resumeId, organizationId, {
			structuredData: restored as any,
			status: ResumeStatus.READY,
		});
	} catch (e) {
		return { success: false, error: "RETRY_FAILED" };
	}
}

export type TailorResult = {
	resume: ResumeRecord;
	refinement_stats: {
		keywords_injected: number;
		phrases_replaced: number;
		diffs_applied: number;
		rejected_changes: number;
	};
	warnings: RefinementWarning[];
	pdf_url: string | null;
};

export async function tailorResume(
	organizationId: string,
	input: {
		resumeId?: string; // optional — defaults to org master (FR-021)
		jobDescription: string;
		strategy?: TailorStrategy;
		outputLanguage?: string;
		generatePdf?: boolean;
	},
): Promise<ServerActionResult<TailorResult>> {
	try {
		// Resolve source resume — use provided ID or fall back to org master (FR-022)
		const originalRecord = await prisma.resume.findFirst({
			where: {
				organizationId,
				...(input.resumeId
					? { id: input.resumeId }
					: { isMaster: true }),
			},
			select: resumeSelect,
		});

		if (!originalRecord) {
			return {
				success: false,
				error: input.resumeId ? "NOT_FOUND" : "NO_MASTER_RESUME",
			};
		}

		const sourceId = originalRecord.id;
		const original = { success: true, data: originalRecord } as const;

		if (!original.data.structuredData)
			return { success: false, error: "RESUME_NOT_PARSED" };

		const strategy = input.strategy ?? TailorStrategy.NUDGE;
		const language = input.outputLanguage ?? "en";

		// Step 1: Extract Keywords from JD (FR-033)
		const keywordResult = await completeJson<any>(
			organizationId,
			EXTRACT_KEYWORDS_PROMPT.replace(
				"{job_description}",
				input.jobDescription,
			),
		);
		const keywords = keywordResult.success ? keywordResult.data : {};

		// Step 2: Primary Tailoring Pass
		const promptKey =
			strategy.toLowerCase() as keyof typeof IMPROVE_RESUME_PROMPTS;
		const primaryTailoringPrompt =
			IMPROVE_RESUME_PROMPTS[promptKey] ??
			IMPROVE_RESUME_PROMPTS.keywords;

		const primaryResult = await completeJson<ResumeData>(
			organizationId,
			primaryTailoringPrompt
				.replace(
					"{critical_truthfulness_rules}",
					CRITICAL_TRUTHFULNESS_RULES[promptKey] ??
						CRITICAL_TRUTHFULNESS_RULES.keywords,
				)
				.replace("{output_language}", language)
				.replace("{job_description}", input.jobDescription)
				.replace("{job_keywords}", JSON.stringify(keywords))
				.replace(
					"{original_resume}",
					JSON.stringify(original.data.structuredData),
				)
				.replace("{schema}", IMPROVE_SCHEMA_EXAMPLE),
		);

		if (!primaryResult.success)
			return { success: false, error: "PRIMARY_TAILORING_FAILED" };

		let diffsApplied = 0;

		// Step 3 & 4: Multi-Pass Refinement Pipeline (FR-047, FR-051)
		const refinementResult = await refineResume(organizationId, {
			initialTailored: primaryResult.data as unknown as Record<
				string,
				unknown
			>,
			masterResume: original.data.structuredData as unknown as Record<
				string,
				unknown
			>,
			jobDescription: input.jobDescription,
			jobKeywords: keywords,
		});

		const finalResumeData = refinementResult.refined_data;
		diffsApplied += refinementResult.passes_completed;

		// Collect warnings
		const warnings: RefinementWarning[] = [];
		if (
			refinementResult.alignment_report &&
			!refinementResult.alignment_report.is_aligned
		) {
			for (const v of refinementResult.alignment_report.violations) {
				if (v.severity === "critical") continue; // critical violations are auto-fixed
				warnings.push({
					code: v.violation_type.toUpperCase() as any,
					detail: `Alignment issue found: ${v.value}`,
					severity: v.severity as any,
					field_path: v.field_path,
					value: v.value,
				});
			}
		}
		if (refinementResult.ai_phrases_removed.length > 0) {
			warnings.push({
				code: "AI_PHRASE_DETECTED",
				detail: `Removed ${refinementResult.ai_phrases_removed.length} common AI phrases.`,
				severity: "info",
			});
		}

		// Safety net: restore personalInfo from source (FR-043)
		const completeResumeData = {
			...finalResumeData,
			personalInfo: (original.data.structuredData as any).personalInfo,
		};

		// Step 5: Persist the tailored resume atomically (FR-025)
		const saveResult = await createResumeRecord({
			organizationId,
			markdown: original.data.markdown ?? "",
			html: original.data.html ?? "",
			structuredData: completeResumeData as any,
			filename: `Tailored - ${original.data.filename}`,
			status: ResumeStatus.READY,
			parentId: sourceId,
			jobDescription: input.jobDescription,
			jobKeywords: keywords,
			strategy,
			outputLanguage: language,
		});

		if (!saveResult.success) return saveResult as ServerActionResult<never>;

		const tailoredResume = saveResult.data;

		let pdfUrl: string | null = null;
		if (input.generatePdf && tailoredResume.html) {
			try {
				const pdfBuffer = await generatePdfFromHtml(
					tailoredResume.html,
				);
				await cacheResumePdf(
					tailoredResume.id,
					organizationId,
					pdfBuffer,
				);
				pdfUrl = `/api/v1/resumes/${tailoredResume.id}/pdf`;
			} catch {
				pdfUrl = null;
			}
		}

		return {
			success: true,
			data: {
				resume: tailoredResume,
				refinement_stats: {
					keywords_injected:
						refinementResult.keyword_analysis?.injectable_keywords
							.length || 0,
					phrases_replaced:
						refinementResult.ai_phrases_removed.length,
					diffs_applied: diffsApplied,
					rejected_changes:
						refinementResult.alignment_report?.violations.filter(
							(v) => v.severity === "critical",
						).length || 0,
				},
				warnings,
				pdf_url: pdfUrl,
			},
		};
	} catch (e) {
		return { success: false, error: "TAILORING_PROCESS_FAILED" };
	}
}
