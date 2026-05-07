// src/lib/refiner.ts
// Multi-pass refinement: keyword injection → AI phrase removal → alignment validation.

import { completeJson } from "@/lib/llm";
import { AI_PHRASE_REPLACEMENTS, KEYWORD_INJECTION_PROMPT } from "@/lib/prompts/refinement";
import type {
    RefinementResult,
    RefinementConfig,
    KeywordGapAnalysis,
    AlignmentReport,
    AlignmentViolation,
} from "@/types";

const DEFAULT_CONFIG: RefinementConfig = {
    enable_keyword_injection: true,
    enable_ai_phrase_removal: true,
    enable_master_alignment_check: true,
    max_refinement_passes: 2,
};

const MAX_JD_LENGTH = 2000;

// ─── Word-Boundary Keyword Matching ──────────────────────────────────────────

function keywordInText(keyword: string, text: string): boolean {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

// ─── Extract All Text ─────────────────────────────────────────────────────────

function extractAllText(data: Record<string, unknown>): string {
    const parts: string[] = [];

    if (typeof data["summary"] === "string") parts.push(data["summary"]);

    for (const exp of (Array.isArray(data["workExperience"]) ? data["workExperience"] as Record<string, unknown>[] : [])) {
        if (typeof exp["title"] === "string") parts.push(exp["title"]);
        if (typeof exp["company"] === "string") parts.push(exp["company"]);
        const desc = exp["description"];
        if (Array.isArray(desc)) parts.push(...desc.filter((d): d is string => typeof d === "string"));
    }

    for (const proj of (Array.isArray(data["personalProjects"]) ? data["personalProjects"] as Record<string, unknown>[] : [])) {
        if (typeof proj["name"] === "string") parts.push(proj["name"]);
        if (typeof proj["role"] === "string") parts.push(proj["role"]);
        const desc = proj["description"];
        if (Array.isArray(desc)) parts.push(...desc.filter((d): d is string => typeof d === "string"));
    }

    const additional = data["additional"];
    if (typeof additional === "object" && additional !== null) {
        const add = additional as Record<string, unknown>;
        for (const field of ["technicalSkills", "certificationsTraining", "languages", "awards"]) {
            const val = add[field];
            if (Array.isArray(val)) parts.push(...val.filter((s): s is string => typeof s === "string"));
        }
    }

    const customSections = data["customSections"];
    if (typeof customSections === "object" && customSections !== null) {
        for (const section of Object.values(customSections as Record<string, unknown>)) {
            if (typeof section !== "object" || section === null) continue;
            const sec = section as Record<string, unknown>;
            const sectionType = sec["sectionType"];

            if (sectionType === "itemList") {
                const items = sec["items"];
                if (Array.isArray(items)) {
                    for (const item of items) {
                        if (typeof item !== "object" || item === null) continue;
                        const it = item as Record<string, unknown>;
                        if (typeof it["title"] === "string") parts.push(it["title"]);
                        if (typeof it["subtitle"] === "string") parts.push(it["subtitle"]);
                        const desc = it["description"];
                        if (Array.isArray(desc)) parts.push(...desc.filter((d): d is string => typeof d === "string"));
                    }
                }
            } else if (sectionType === "text") {
                const text = sec["text"];
                if (typeof text === "string") parts.push(text);
            } else if (sectionType === "stringList") {
                const strings = sec["strings"];
                if (Array.isArray(strings)) parts.push(...strings.filter((s): s is string => typeof s === "string"));
            }
        }
    }

    return parts.filter(Boolean).join(" ");
}

// ─── Pass 1: Keyword Gap Analysis ────────────────────────────────────────────

export function analyzeKeywordGaps(
    jdKeywords: Record<string, unknown>,
    tailored: Record<string, unknown>,
    master: Record<string, unknown>
): KeywordGapAnalysis {
    const tailoredText = extractAllText(tailored).toLowerCase();
    const masterText = extractAllText(master).toLowerCase();

    const allKeywords = new Set<string>([
        ...(Array.isArray(jdKeywords["required_skills"]) ? jdKeywords["required_skills"] as string[] : []),
        ...(Array.isArray(jdKeywords["preferred_skills"]) ? jdKeywords["preferred_skills"] as string[] : []),
        ...(Array.isArray(jdKeywords["keywords"]) ? jdKeywords["keywords"] as string[] : []),
    ]);

    const missing: string[] = [];
    const injectable: string[] = [];
    const nonInjectable: string[] = [];

    for (const keyword of allKeywords) {
        if (!keywordInText(keyword, tailoredText)) {
            missing.push(keyword);
            if (keywordInText(keyword, masterText)) injectable.push(keyword);
            else nonInjectable.push(keyword);
        }
    }

    const total = allKeywords.size || 1;
    const currentMatch = ((total - missing.length) / total) * 100;
    const potentialMatch = ((total - nonInjectable.length) / total) * 100;

    return {
        missing_keywords: missing,
        injectable_keywords: injectable,
        non_injectable_keywords: nonInjectable,
        current_match_percentage: currentMatch,
        potential_match_percentage: potentialMatch,
    };
}

// ─── Pass 2: AI Phrase Removal (local, no LLM) ───────────────────────────────

export function removeAiPhrases(
    data: Record<string, unknown>,
    jobDescription = ""
): { data: Record<string, unknown>; removed: string[] } {
    const jdLower = jobDescription.toLowerCase();
    const jdProtected = new Set(
        Object.keys(AI_PHRASE_REPLACEMENTS).filter((p) => jdLower.includes(p.toLowerCase()))
    );

    const removed = new Set<string>();

    function cleanText(text: string): string {
        let cleaned = text;
        for (const [phrase, replacement] of Object.entries(AI_PHRASE_REPLACEMENTS)) {
            if (jdProtected.has(phrase.toLowerCase())) continue;
            if (cleaned.toLowerCase().includes(phrase.toLowerCase())) {
                removed.add(phrase);
                cleaned = cleaned.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replacement);
            }
        }
        return cleaned;
    }

    function cleanRecursive(obj: unknown): unknown {
        if (typeof obj === "string") return cleanText(obj);
        if (Array.isArray(obj)) return obj.map(cleanRecursive);
        if (typeof obj === "object" && obj !== null) {
            return Object.fromEntries(
                Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, cleanRecursive(v)])
            );
        }
        return obj;
    }

    const cleaned = cleanRecursive(data) as Record<string, unknown>;
    return { data: cleaned, removed: [...removed] };
}

// ─── Pass 3: Master Alignment Validation (local) ─────────────────────────────

export function validateMasterAlignment(
    tailored: Record<string, unknown>,
    master: Record<string, unknown>
): AlignmentReport {
    const violations: AlignmentViolation[] = [];
    const masterFullText = extractAllText(master).toLowerCase();

    const tailoredAdditional = tailored["additional"] as Record<string, unknown> | undefined;
    const masterAdditional = master["additional"] as Record<string, unknown> | undefined;

    // Check skills
    const tailoredSkills = new Set(
        (Array.isArray(tailoredAdditional?.["technicalSkills"]) ? tailoredAdditional!["technicalSkills"] as string[] : [])
            .map((s) => s.toLowerCase())
    );
    const masterSkills = new Set(
        (Array.isArray(masterAdditional?.["technicalSkills"]) ? masterAdditional!["technicalSkills"] as string[] : [])
            .map((s) => s.toLowerCase())
    );

    for (const skill of tailoredSkills) {
        if (!masterSkills.has(skill)) {
            const hasSubstring = [...masterSkills].some((ms) => ms.includes(skill) || skill.includes(ms));
            const foundInText = keywordInText(skill, masterFullText);
            violations.push({
                field_path: "additional.technicalSkills",
                violation_type: hasSubstring || foundInText ? "skill_variant" : "fabricated_skill",
                value: skill,
                severity: hasSubstring || foundInText ? "info" : "critical",
            });
        }
    }

    // Check certifications
    const tailoredCerts = new Set(
        (Array.isArray(tailoredAdditional?.["certificationsTraining"]) ? tailoredAdditional!["certificationsTraining"] as string[] : [])
            .map((s) => s.toLowerCase())
    );
    const masterCerts = new Set(
        (Array.isArray(masterAdditional?.["certificationsTraining"]) ? masterAdditional!["certificationsTraining"] as string[] : [])
            .map((s) => s.toLowerCase())
    );
    for (const cert of tailoredCerts) {
        if (!masterCerts.has(cert)) {
            violations.push({ field_path: "additional.certificationsTraining", violation_type: "fabricated_cert", value: cert, severity: "critical" });
        }
    }

    // Check companies
    const tailoredCompanies = new Set(
        (Array.isArray(tailored["workExperience"]) ? tailored["workExperience"] as Record<string, unknown>[] : [])
            .map((e) => String(e["company"] ?? "").toLowerCase())
            .filter(Boolean)
    );
    const masterCompanies = new Set(
        (Array.isArray(master["workExperience"]) ? master["workExperience"] as Record<string, unknown>[] : [])
            .map((e) => String(e["company"] ?? "").toLowerCase())
            .filter(Boolean)
    );
    for (const company of tailoredCompanies) {
        if (!masterCompanies.has(company)) {
            violations.push({ field_path: "workExperience", violation_type: "fabricated_company", value: company, severity: "critical" });
        }
    }

    const criticalCount = violations.filter((v) => v.severity === "critical").length;
    return {
        is_aligned: criticalCount === 0,
        violations,
        confidence_score: Math.max(0, 1.0 - violations.length * 0.1),
    };
}

export function fixAlignmentViolations(
    tailored: Record<string, unknown>,
    violations: AlignmentViolation[]
): Record<string, unknown> {
    const fixed = structuredClone(tailored);
    const additional = fixed["additional"] as Record<string, unknown> | undefined;

    for (const v of violations) {
        if (v.severity !== "critical") continue;
        if (v.violation_type === "fabricated_skill" && additional) {
            additional["technicalSkills"] = (additional["technicalSkills"] as string[] ?? [])
                .filter((s) => s.toLowerCase() !== v.value.toLowerCase());
        } else if (v.violation_type === "fabricated_cert" && additional) {
            additional["certificationsTraining"] = (additional["certificationsTraining"] as string[] ?? [])
                .filter((c) => c.toLowerCase() !== v.value.toLowerCase());
        } else if (v.violation_type === "fabricated_company") {
            fixed["workExperience"] = (Array.isArray(fixed["workExperience"]) ? fixed["workExperience"] as Record<string, unknown>[] : [])
                .filter((e) => String(e["company"] ?? "").toLowerCase() !== v.value.toLowerCase());
        }
    }

    return fixed;
}

// ─── Calculate Keyword Match ──────────────────────────────────────────────────

export function calculateKeywordMatch(resume: Record<string, unknown>, jdKeywords: Record<string, unknown>): number {
    const resumeText = extractAllText(resume).toLowerCase();
    const allKeywords = new Set<string>([
        ...(Array.isArray(jdKeywords["required_skills"]) ? jdKeywords["required_skills"] as string[] : []),
        ...(Array.isArray(jdKeywords["preferred_skills"]) ? jdKeywords["preferred_skills"] as string[] : []),
        ...(Array.isArray(jdKeywords["keywords"]) ? jdKeywords["keywords"] as string[] : []),
    ]);
    if (allKeywords.size === 0) return 0;
    const matched = [...allKeywords].filter((kw) => keywordInText(kw, resumeText)).length;
    return (matched / allKeywords.size) * 100;
}

// ─── Main Refine Entry Point ──────────────────────────────────────────────────

export async function refineResume(
    userId: string,
    params: {
        initialTailored: Record<string, unknown>;
        masterResume: Record<string, unknown>;
        jobDescription: string;
        jobKeywords: Record<string, unknown>;
        config?: Partial<RefinementConfig>;
    }
): Promise<RefinementResult> {
    const { initialTailored, masterResume, jobDescription, jobKeywords } = params;
    const config: RefinementConfig = { ...DEFAULT_CONFIG, ...(params.config ?? {}) };

    let current = structuredClone(initialTailored);
    let passes = 0;
    const aiPhrasesFound: string[] = [];
    let keywordAnalysis: KeywordGapAnalysis | null = null;
    let alignmentReport: AlignmentReport | null = null;

    // Pass 1: Keyword injection
    if (config.enable_keyword_injection) {
        keywordAnalysis = analyzeKeywordGaps(jobKeywords, current, masterResume);
        if (keywordAnalysis.injectable_keywords.length > 0) {
            const truncatedJd = jobDescription.slice(0, MAX_JD_LENGTH);
            const prompt = KEYWORD_INJECTION_PROMPT
                .replace("{keywords_to_inject}", JSON.stringify(keywordAnalysis.injectable_keywords))
                .replace("{current_resume}", JSON.stringify(current))
                .replace("{master_resume}", JSON.stringify(masterResume))
                .replace("{job_description}", truncatedJd);

            try {
                const result = await completeJson(userId, prompt, {
                    systemPrompt: "You are a resume editor. Inject keywords naturally without adding fabricated content. Return only valid JSON matching the input schema.",
                    maxTokens: 8192,
                });
                if (typeof result === "object" && result !== null && "personalInfo" in result) {
                    current = result;
                    passes++;
                }
            } catch {
                // Keyword injection failed — continue without it
            }
        }
    }

    // Pass 2: AI phrase removal (local)
    if (config.enable_ai_phrase_removal) {
        const { data: cleaned, removed } = removeAiPhrases(current, jobDescription);
        if (removed.length > 0) {
            current = cleaned;
            aiPhrasesFound.push(...removed);
            passes++;
        }
    }

    // Pass 3: Master alignment validation (local)
    if (config.enable_master_alignment_check) {
        alignmentReport = validateMasterAlignment(current, masterResume);
        if (!alignmentReport.is_aligned) {
            current = fixAlignmentViolations(current, alignmentReport.violations);
            passes++;
        }
    }

    const finalMatch = calculateKeywordMatch(current, jobKeywords);

    return {
        refined_data: current,
        passes_completed: passes,
        keyword_analysis: keywordAnalysis,
        alignment_report: alignmentReport,
        ai_phrases_removed: aiPhrasesFound,
        final_match_percentage: finalMatch,
    };
}