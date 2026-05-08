import { prisma } from "@/lib/prisma";
import { Prisma, ResumeStatus, TailorStrategy } from "@prisma/client";
import { completeJson, completeText } from "@/lib/llm";
import {
    PARSE_RESUME_PROMPT,
    EXTRACT_KEYWORDS_PROMPT,
    IMPROVE_RESUME_PROMPTS,
    CRITICAL_TRUTHFULNESS_RULES,
    RESUME_SCHEMA_EXAMPLE,
    IMPROVE_SCHEMA_EXAMPLE
} from "@/lib/prompts/templates";
import { KEYWORD_INJECTION_PROMPT, VALIDATION_POLISH_PROMPT } from "@/lib/prompts/refinement";
import { restoreDatesFromMarkdown } from "@/lib/resume-utils";
import { ResumeData } from "@/types/resume";

// Shared select shape
const resumeSelect = {
    id: true,
    organizationId: true,
    isMaster: true,
    parentId: true,
    status: true,
    filename: true,
    originalMarkdown: true,
    structuredData: true,
    jobDescription: true,
    jobKeywords: true,
    strategy: true,
    title: true,
    outputLanguage: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type ResumeRecord = Prisma.ResumeGetPayload<{ select: typeof resumeSelect }>;

export type ServerActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export async function getResumeById(
    resumeId: string,
    organizationId: string
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
    params: { limit: number; offset: number } = { limit: 10, offset: 0 }
): Promise<ServerActionResult<ResumeRecord[]>> {
    try {
        const resumes = await prisma.resume.findMany({
            where: {
                organizationId,
                ...(includeMaster ? {} : { isMaster: false }),
            },
            select: resumeSelect,
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
    originalMarkdown: string;
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
                    where: { organizationId: input.organizationId, isMaster: true },
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
    }>
): Promise<ServerActionResult<ResumeRecord>> {
    try {
        const existing = await prisma.resume.findFirst({
            where: { id: resumeId, organizationId },
            select: { id: true },
        });
        if (!existing) return { success: false, error: "NOT_FOUND" };

        const result = await prisma.resume.update({
            where: { id: resumeId },
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
    organizationId: string
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
    organizationId: string
): Promise<ServerActionResult<ResumeRecord>> {
    const resume = await getResumeById(resumeId, organizationId);
    if (!resume.success) return resume;

    if (!resume.data.originalMarkdown) {
        return { success: false, error: "MISSING_SOURCE_TEXT" };
    }

    try {
        const parsedResult = await completeJson<ResumeData>(
            organizationId,
            PARSE_RESUME_PROMPT
                .replace("{schema}", RESUME_SCHEMA_EXAMPLE)
                .replace("{resume_text}", resume.data.originalMarkdown)
        );

        if (!parsedResult.success) return { success: false, error: "LLM_PARSING_FAILED" };

        const restored = restoreDatesFromMarkdown(parsedResult.data as Record<string, any>, resume.data.originalMarkdown);

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
    cover_letter_id: string | null;
    outreach_id: string | null;
    refinement_stats: {
        keywords_injected: number;
        phrases_replaced: number;
        diffs_applied: number;
        rejected_changes: number;
    };
};

export async function tailorResume(
    organizationId: string,
    input: {
        resumeId?: string;           // optional — defaults to org master (FR-021)
        jobDescription: string;
        strategy?: TailorStrategy;
        outputLanguage?: string;
        generateCoverLetter?: boolean;
        generateOutreach?: boolean;
    }
): Promise<ServerActionResult<TailorResult>> {
    try {
        // Resolve source resume — use provided ID or fall back to org master (FR-022)
        let sourceId = input.resumeId;
        if (!sourceId) {
            const master = await prisma.resume.findFirst({
                where: { organizationId, isMaster: true },
                select: { id: true },
            });
            if (!master) return { success: false, error: "NO_MASTER_RESUME" };
            sourceId = master.id;
        }

        const original = await getResumeById(sourceId, organizationId);
        if (!original.success) return original as ServerActionResult<never>;
        if (!original.data.structuredData) return { success: false, error: "RESUME_NOT_PARSED" };

        const strategy = input.strategy ?? TailorStrategy.NUDGE;
        const language = input.outputLanguage ?? "en";

        // Step 1: Extract Keywords from JD (FR-033)
        const keywordResult = await completeJson<any>(
            organizationId,
            EXTRACT_KEYWORDS_PROMPT.replace("{job_description}", input.jobDescription)
        );
        const keywords = keywordResult.success ? keywordResult.data : {};

        // Step 2: Primary Tailoring Pass
        const promptKey = strategy.toLowerCase() as keyof typeof IMPROVE_RESUME_PROMPTS;
        const primaryTailoringPrompt =
            IMPROVE_RESUME_PROMPTS[promptKey] ?? IMPROVE_RESUME_PROMPTS.keywords;

        const primaryResult = await completeJson<ResumeData>(
            organizationId,
            primaryTailoringPrompt
                .replace("{critical_truthfulness_rules}", CRITICAL_TRUTHFULNESS_RULES[promptKey] ?? CRITICAL_TRUTHFULNESS_RULES.keywords)
                .replace("{output_language}", language)
                .replace("{job_description}", input.jobDescription)
                .replace("{job_keywords}", JSON.stringify(keywords))
                .replace("{original_resume}", JSON.stringify(original.data.structuredData))
                .replace("{schema}", IMPROVE_SCHEMA_EXAMPLE)
        );

        if (!primaryResult.success) return { success: false, error: "PRIMARY_TAILORING_FAILED" };

        let diffsApplied = 0;

        // Step 3: Keyword Injection Pass (FR-047)
        const injectionResult = await completeJson<ResumeData>(
            organizationId,
            KEYWORD_INJECTION_PROMPT
                .replace("{keywords_to_inject}", JSON.stringify(keywords.required_skills ?? []))
                .replace("{current_resume}", JSON.stringify(primaryResult.data))
                .replace("{master_resume}", JSON.stringify(original.data.structuredData))
                .replace("{job_description}", input.jobDescription)
        );

        const afterInjection = injectionResult.success ? injectionResult.data : primaryResult.data;
        if (injectionResult.success) diffsApplied++;

        // Step 4: Validation & Polish Pass (FR-051)
        const finalResult = await completeJson<ResumeData>(
            organizationId,
            VALIDATION_POLISH_PROMPT
                .replace("{resume}", JSON.stringify(afterInjection))
                .replace("{master_resume}", JSON.stringify(original.data.structuredData))
        );

        const finalResumeData = finalResult.success ? finalResult.data : afterInjection;
        if (finalResult.success) diffsApplied++;

        // Safety net: restore personalInfo from source (FR-043)
        const completeResumeData = {
            ...finalResumeData,
            personalInfo: (original.data.structuredData as any).personalInfo,
        };

        // Step 5: Persist the tailored resume atomically (FR-025)
        const saveResult = await createResumeRecord({
            organizationId,
            originalMarkdown: original.data.originalMarkdown ?? "",
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

        // Step 6: Generate cover letter + outreach in parallel (FR-029)
        // Failures must NOT block the tailor response.
        let coverLetterId: string | null = null;
        let outreachId: string | null = null;

        if (input.generateCoverLetter || input.generateOutreach) {
            // Lazy import to avoid circular dependency
            const { generateCoverLetter } = await import("./cover-letters");
            const { generateOutreach } = await import("./outreach");

            const [clResult, outResult] = await Promise.allSettled([
                input.generateCoverLetter
                    ? generateCoverLetter(tailoredResume.id, organizationId, {
                        jobDescription: input.jobDescription,
                        outputLanguage: language,
                    })
                    : Promise.resolve(null),
                input.generateOutreach
                    ? generateOutreach(tailoredResume.id, organizationId, input.jobDescription, language)
                    : Promise.resolve(null),
            ]);

            if (clResult.status === "fulfilled" && clResult.value?.success) {
                coverLetterId = clResult.value.data.id;
            }
            if (outResult.status === "fulfilled" && outResult.value?.success) {
                outreachId = outResult.value.data.id;
            }
        }

        return {
            success: true,
            data: {
                resume: tailoredResume,
                cover_letter_id: coverLetterId,
                outreach_id: outreachId,
                refinement_stats: {
                    keywords_injected: (keywords.required_skills ?? []).length,
                    phrases_replaced: 0, // local regex pass not yet implemented
                    diffs_applied: diffsApplied,
                    rejected_changes: 0,
                },
            },
        };
    } catch (e) {
        return { success: false, error: "TAILORING_PROCESS_FAILED" };
    }
}