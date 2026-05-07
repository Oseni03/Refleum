// src/lib/improver.ts
// Resume improvement service — diff-based patching with 4-gate verification.

import { completeJson, sanitizeUserInput } from "@/lib/llm";
import {
    DIFF_IMPROVE_PROMPT,
    DIFF_STRATEGY_INSTRUCTIONS,
    IMPROVE_RESUME_PROMPTS,
    IMPROVE_SCHEMA_EXAMPLE,
    CRITICAL_TRUTHFULNESS_RULES,
    DEFAULT_IMPROVE_PROMPT_ID,
    EXTRACT_KEYWORDS_PROMPT,
} from "@/lib/prompts/templates";
import { getLanguageName } from "@/lib/prompts/templates";
import type {
    ResumeChange,
    ImproveDiffResult,
    ResumeFieldDiff,
    ResumeDiffSummary,
    ImprovementSuggestion,
    JobKeywords,
} from "@/types";

// ─── Allowed / Blocked Path Sets ─────────────────────────────────────────────

const ALLOWED_PATH_PATTERNS = [
    /^summary$/,
    /^workExperience\[\d+\]\.description(\[\d+\])?$/,
    /^personalProjects\[\d+\]\.description(\[\d+\])?$/,
    /^additional\.technicalSkills$/,
    /^customSections\.[^.]+\.(items\[\d+\]\.description|strings)(\[\d+\])?$/,
];

const BLOCKED_PATH_PREFIXES = new Set([
    "personalInfo",
    "sectionMeta",
]);

const BLOCKED_FIELD_NAMES = new Set([
    "years", "company", "institution", "title", "degree",
    "name", "role", "github", "website", "location", "id",
]);

const PATH_SEGMENT_RE = /([a-zA-Z_]+)(?:\[(\d+)\])?/g;
const METRIC_RE = /\d+%|\d+x|\$\d+/g;

export const MONTH_PATTERN =
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i;

// ─── Path Helpers ─────────────────────────────────────────────────────────────

function isPathAllowed(path: string): boolean {
    return ALLOWED_PATH_PATTERNS.some((p) => p.test(path));
}

function isPathBlocked(path: string): boolean {
    for (const prefix of BLOCKED_PATH_PREFIXES) {
        if (path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`)) {
            return true;
        }
    }
    const segments = path.split(".");
    const last = segments[segments.length - 1] ?? "";
    const fieldName = last.replace(/\[\d+\]$/, "");
    if (fieldName !== "description" && BLOCKED_FIELD_NAMES.has(fieldName)) return true;
    if (path.startsWith("education")) return true;
    return false;
}

function resolvePath(data: Record<string, unknown>, path: string): { value: unknown; found: boolean } {
    let current: unknown = data;
    const re = /([a-zA-Z_]+)(?:\[(\d+)\])?/g;
    let match: RegExpExecArray | null;

    while ((match = re.exec(path)) !== null) {
        const key = match[1] as string;
        const indexStr = match[2];

        if (typeof current !== "object" || current === null) return { value: undefined, found: false };
        if (!(key in (current as Record<string, unknown>))) return { value: undefined, found: false };
        current = (current as Record<string, unknown>)[key];

        if (indexStr !== undefined) {
            const index = parseInt(indexStr, 10);
            if (!Array.isArray(current) || index < 0 || index >= current.length) {
                return { value: undefined, found: false };
            }
            current = current[index];
        }
    }

    return { value: current, found: true };
}

function setAtPath(data: Record<string, unknown>, path: string, value: unknown): boolean {
    const segments: Array<{ key: string; index?: number }> = [];
    const re = /([a-zA-Z_]+)(?:\[(\d+)\])?/g;
    let match: RegExpExecArray | null;

    while ((match = re.exec(path)) !== null) {
        segments.push({ key: match[1] as string, index: match[2] !== undefined ? parseInt(match[2], 10) : undefined });
    }

    if (segments.length === 0) return false;

    let current: unknown = data;
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]!;
        if (typeof current !== "object" || current === null) return false;
        current = (current as Record<string, unknown>)[seg.key];
        if (seg.index !== undefined) {
            if (!Array.isArray(current) || seg.index >= current.length) return false;
            current = current[seg.index];
        }
    }

    const last = segments[segments.length - 1]!;
    if (last.index !== undefined) {
        const parent = (current as Record<string, unknown>)[last.key];
        if (!Array.isArray(parent) || last.index >= parent.length) return false;
        parent[last.index] = value;
    } else {
        if (typeof current !== "object" || current === null) return false;
        (current as Record<string, unknown>)[last.key] = value;
    }

    return true;
}

function originalMatches(actual: unknown, expected: string | null | undefined): boolean {
    if (expected === null || expected === undefined) return true;
    if (typeof actual !== "string") return false;
    return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

// ─── Apply Diffs (4-gate verification) ───────────────────────────────────────

export function applyDiffs(
    original: Record<string, unknown>,
    changes: ResumeChange[]
): { result: Record<string, unknown>; applied: ResumeChange[]; rejected: ResumeChange[] } {
    const result = structuredClone(original);
    const applied: ResumeChange[] = [];
    const rejected: ResumeChange[] = [];

    for (const change of changes) {
        const { path, action } = change;

        // Gate 1: allowed whitelist
        if (!isPathAllowed(path)) { rejected.push(change); continue; }
        // Gate 2: not blocked
        if (isPathBlocked(path)) { rejected.push(change); continue; }
        // Gate 3: path resolves
        const { value: actualValue, found } = resolvePath(result, path);
        if (!found) { rejected.push(change); continue; }

        if (action === "replace") {
            // Gate 4: original text matches
            if (!originalMatches(actualValue, change.original)) { rejected.push(change); continue; }
            if (typeof change.value !== "string") { rejected.push(change); continue; }
            if (!setAtPath(result, path, change.value)) { rejected.push(change); continue; }
            applied.push(change);
        } else if (action === "append") {
            if (!Array.isArray(actualValue)) { rejected.push(change); continue; }
            if (typeof change.value !== "string" || !change.value.trim()) { rejected.push(change); continue; }
            actualValue.push(change.value);
            applied.push(change);
        } else if (action === "reorder") {
            if (!Array.isArray(actualValue) || !Array.isArray(change.value)) { rejected.push(change); continue; }
            const origSet = [...actualValue].filter((s): s is string => typeof s === "string").map((s) => s.toLowerCase()).sort();
            const newSet = [...change.value].filter((s): s is string => typeof s === "string").map((s) => s.toLowerCase()).sort();
            if (JSON.stringify(origSet) !== JSON.stringify(newSet)) { rejected.push(change); continue; }
            // Preserve original casing
            const caseMap: Record<string, string[]> = {};
            for (const item of actualValue as string[]) {
                const k = item.toLowerCase();
                caseMap[k] = [...(caseMap[k] ?? []), item];
            }
            const reordered = (change.value as string[]).map((item) => {
                const k = item.toLowerCase();
                return caseMap[k]?.shift() ?? item;
            });
            if (!setAtPath(result, path, reordered)) { rejected.push(change); continue; }
            applied.push(change);
        } else {
            rejected.push(change);
        }
    }

    return { result, applied, rejected };
}

// ─── Verify Diff Result (local quality checks) ────────────────────────────────

export function verifyDiffResult(
    original: Record<string, unknown>,
    result: Record<string, unknown>,
    appliedChanges: ResumeChange[],
    _jobKeywords: Record<string, unknown>
): string[] {
    const warnings: string[] = [];

    if (appliedChanges.length === 0) {
        warnings.push("No changes were applied — resume returned unchanged");
        return warnings;
    }

    // Section counts preserved
    for (const [key, label] of [["workExperience", "work experience"], ["education", "education"], ["personalProjects", "project"]] as const) {
        const origCount = Array.isArray(original[key]) ? (original[key] as unknown[]).length : 0;
        const resultCount = Array.isArray(result[key]) ? (result[key] as unknown[]).length : 0;
        if (origCount !== resultCount) {
            warnings.push(`Section count changed: ${label} (${origCount} → ${resultCount})`);
        }
    }

    // Invented metrics
    for (const change of appliedChanges) {
        if (change.action === "replace" || change.action === "append") {
            if (typeof change.value !== "string") continue;
            const newMetrics = new Set(change.value.match(METRIC_RE) ?? []);
            const oldMetrics = new Set(change.original?.match(METRIC_RE) ?? []);
            const invented = [...newMetrics].filter((m) => !oldMetrics.has(m));
            if (invented.length > 0) {
                warnings.push(`Possible invented metric in ${change.path}: ${invented.join(", ")}`);
            }
        }
    }

    return warnings;
}

// ─── Generate Resume Diffs via LLM ───────────────────────────────────────────

export async function generateResumeDiffs(
    userId: string,
    params: {
        originalResume: string;
        jobDescription: string;
        jobKeywords: JobKeywords;
        language: string;
        promptId?: string;
        originalResumeData?: Record<string, unknown>;
    }
): Promise<ImproveDiffResult> {
    const { originalResume, jobDescription, jobKeywords, language, promptId, originalResumeData } = params;
    const sanitizedJd = sanitizeUserInput(jobDescription);
    const outputLanguage = getLanguageName(language);
    const selectedId = promptId ?? DEFAULT_IMPROVE_PROMPT_ID;
    const strategyInstruction = DIFF_STRATEGY_INSTRUCTIONS[selectedId] ?? DIFF_STRATEGY_INSTRUCTIONS[DEFAULT_IMPROVE_PROMPT_ID]!;
    const keywordsStr = prepareKeywordsForPrompt(jobKeywords);

    const hasMonthDates = originalResumeData ? _hasMonthInDates(originalResumeData) : false;
    const resumeInput = originalResumeData && hasMonthDates
        ? JSON.stringify(originalResumeData)
        : originalResume;

    const prompt = DIFF_IMPROVE_PROMPT
        .replace("{strategy_instruction}", strategyInstruction)
        .replace("{output_language}", outputLanguage)
        .replace("{job_keywords}", keywordsStr)
        .replace("{job_description}", sanitizedJd)
        .replace("{original_resume}", resumeInput);

    const response = await completeJson<ImproveDiffResult>(userId, prompt, {
        systemPrompt: "You are an expert resume editor. Output only valid JSON with targeted changes.",
        maxTokens: 4096,
    });

    if (!response.success) {
        return { changes: [], strategy_notes: `Error: ${response.error}` };
    }

    const data = response.data;
    const rawChanges = Array.isArray(data.changes) ? data.changes : [];
    const changes: ResumeChange[] = [];

    for (const r of rawChanges) {
        if (typeof r !== "object" || r === null) continue;
        try {
            changes.push({
                path: String(r.path ?? ""),
                action: (r.action as ResumeChange["action"]) ?? "replace",
                original: typeof r.original === "string" ? r.original : null,
                value: (r.value as string | string[]) ?? "",
                reason: String(r.reason ?? ""),
            });
        } catch {
            // Skip malformed changes
        }
    }

    return { changes, strategy_notes: String(data.strategy_notes ?? "") };
}

// ─── Full-Output Improve (fallback) ──────────────────────────────────────────

export async function improveResume(
    userId: string,
    params: {
        originalResume: string;
        jobDescription: string;
        jobKeywords: JobKeywords;
        language: string;
        promptId?: string;
        originalResumeData?: Record<string, unknown>;
    }
): Promise<Record<string, unknown>> {
    const { originalResume, jobDescription, jobKeywords, language, promptId, originalResumeData } = params;
    const sanitizedJd = sanitizeUserInput(jobDescription);
    const outputLanguage = getLanguageName(language);
    const selectedId = promptId ?? DEFAULT_IMPROVE_PROMPT_ID;
    const promptTemplate = IMPROVE_RESUME_PROMPTS[selectedId] ?? IMPROVE_RESUME_PROMPTS[DEFAULT_IMPROVE_PROMPT_ID]!;
    const truthfulnessRules = CRITICAL_TRUTHFULNESS_RULES[selectedId] ?? CRITICAL_TRUTHFULNESS_RULES[DEFAULT_IMPROVE_PROMPT_ID]!;
    const keywordsStr = prepareKeywordsForPrompt(jobKeywords);

    const hasMonthDates = originalResumeData ? _hasMonthInDates(originalResumeData) : false;
    const resumeInput = originalResumeData && hasMonthDates
        ? JSON.stringify(originalResumeData)
        : originalResume;

    const prompt = promptTemplate
        .replace("{job_description}", sanitizedJd)
        .replace("{job_keywords}", keywordsStr)
        .replace("{original_resume}", resumeInput)
        .replace("{schema}", IMPROVE_SCHEMA_EXAMPLE)
        .replace("{output_language}", outputLanguage)
        .replace("{critical_truthfulness_rules}", truthfulnessRules);

    const response = await completeJson<Record<string, unknown>>(userId, prompt, {
        systemPrompt: "You are an expert resume editor. Output only valid JSON.",
        maxTokens: 8192,
    });

    return response.success ? response.data : { error: response.error };
}

// ─── Extract Job Keywords ─────────────────────────────────────────────────────

export async function extractJobKeywords(
    userId: string,
    jobDescription: string
): Promise<JobKeywords | { error: string }> {
    const sanitized = sanitizeUserInput(jobDescription);
    const prompt = EXTRACT_KEYWORDS_PROMPT.replace("{job_description}", sanitized);
    const response = await completeJson<JobKeywords>(userId, prompt, {
        systemPrompt: "You are an expert job description analyzer.",
    });

    return response.success ? response.data : { error: response.error };
}

// ─── Calculate Resume Diff ────────────────────────────────────────────────────

export function calculateResumeDiff(
    original: Record<string, unknown>,
    improved: Record<string, unknown>
): { summary: ResumeDiffSummary; changes: ResumeFieldDiff[] } {
    const changes: ResumeFieldDiff[] = [];

    // Summary diff
    const origSummary = String(original["summary"] ?? "").trim();
    const newSummary = String(improved["summary"] ?? "").trim();
    if (origSummary !== newSummary) {
        changes.push({
            field_path: "summary",
            field_type: "summary",
            change_type: origSummary && !newSummary ? "removed" : !origSummary && newSummary ? "added" : "modified",
            original_value: origSummary || null,
            new_value: newSummary || null,
            confidence: "medium",
        });
    }

    // Skills diff (order-independent)
    const origSkills = new Set((getStringArray(original, ["additional", "technicalSkills"])).map((s) => s.toLowerCase()));
    const newSkills = new Set((getStringArray(improved, ["additional", "technicalSkills"])).map((s) => s.toLowerCase()));
    for (const s of newSkills) if (!origSkills.has(s)) changes.push({ field_path: "additional.technicalSkills", field_type: "skill", change_type: "added", new_value: s, confidence: "high" });
    for (const s of origSkills) if (!newSkills.has(s)) changes.push({ field_path: "additional.technicalSkills", field_type: "skill", change_type: "removed", original_value: s, confidence: "medium" });

    // Certifications diff
    const origCerts = new Set((getStringArray(original, ["additional", "certificationsTraining"])).map((s) => s.toLowerCase()));
    const newCerts = new Set((getStringArray(improved, ["additional", "certificationsTraining"])).map((s) => s.toLowerCase()));
    for (const c of newCerts) if (!origCerts.has(c)) changes.push({ field_path: "additional.certificationsTraining", field_type: "certification", change_type: "added", new_value: c, confidence: "high" });

    // Work experience description diff
    const origExp = getArray(original, "workExperience");
    const newExp = getArray(improved, "workExperience");
    const maxExpLen = Math.max(origExp.length, newExp.length);
    for (let i = 0; i < maxExpLen; i++) {
        const origDesc = getStringArray(origExp[i] ?? {}, ["description"]);
        const newDesc = getStringArray(newExp[i] ?? {}, ["description"]);
        diffStringLists(changes, `workExperience[${i}].description`, "description", origDesc, newDesc);
    }

    // Personal projects description diff
    const origProj = getArray(original, "personalProjects");
    const newProj = getArray(improved, "personalProjects");
    const maxProjLen = Math.max(origProj.length, newProj.length);
    for (let i = 0; i < maxProjLen; i++) {
        const origDesc = getStringArray(origProj[i] ?? {}, ["description"]);
        const newDesc = getStringArray(newProj[i] ?? {}, ["description"]);
        diffStringLists(changes, `personalProjects[${i}].description`, "description", origDesc, newDesc);
    }

    // Custom sections diff
    const origCustom = (original["customSections"] as Record<string, any>) || {};
    const newCustom = (improved["customSections"] as Record<string, any>) || {};
    for (const [key, section] of Object.entries(newCustom)) {
        if (section.sectionType === "itemList") {
            const origItems = (origCustom[key]?.items as any[]) || [];
            const newItems = (section.items as any[]) || [];
            const maxLen = Math.max(origItems.length, newItems.length);
            for (let i = 0; i < maxLen; i++) {
                const oDesc = Array.isArray(origItems[i]?.description) ? origItems[i].description : [];
                const nDesc = Array.isArray(newItems[i]?.description) ? newItems[i].description : [];
                diffStringLists(changes, `customSections.${key}.items[${i}].description`, "description", oDesc, nDesc);
            }
        } else if (section.sectionType === "stringList") {
            const oList = Array.isArray(origCustom[key]?.strings) ? origCustom[key].strings : [];
            const nList = Array.isArray(section.strings) ? section.strings : [];
            diffStringLists(changes, `customSections.${key}.strings`, "description", oList, nList);
        }
    }

    const summary: ResumeDiffSummary = {
        total_changes: changes.length,
        skills_added: changes.filter((c) => c.field_type === "skill" && c.change_type === "added").length,
        skills_removed: changes.filter((c) => c.field_type === "skill" && c.change_type === "removed").length,
        descriptions_modified: changes.filter((c) => c.field_type === "description" && c.change_type === "modified").length,
        certifications_added: changes.filter((c) => c.field_type === "certification" && c.change_type === "added").length,
        high_risk_changes: changes.filter((c) => c.confidence === "high").length,
    };

    return { summary, changes };
}

// ─── Generate Improvement Suggestions ────────────────────────────────────────

export function generateImprovements(jobKeywords: JobKeywords): ImprovementSuggestion[] {
    const improvements: ImprovementSuggestion[] = [];
    const required = jobKeywords.required_skills ?? [];
    for (const skill of required.slice(0, 3)) {
        improvements.push({ suggestion: `Emphasized '${skill}' to match job requirements`, lineNumber: null });
    }
    if (improvements.length === 0) {
        improvements.push({ suggestion: "Resume content optimized for better keyword alignment with job description", lineNumber: null });
    }
    return improvements;
}

export function prepareKeywordsForPrompt(jobKeywords: JobKeywords): string {
    const sections: string[] = [];
    const required = jobKeywords.required_skills ?? [];
    const preferred = jobKeywords.preferred_skills ?? [];
    const otherKeywords = jobKeywords.keywords ?? [];
    if (required.length) sections.push("Required skills:\n- " + required.join("\n- "));
    if (preferred.length) sections.push("Preferred skills:\n- " + preferred.join("\n- "));
    if (otherKeywords.length) sections.push("Additional keywords:\n- " + otherKeywords.join("\n- "));
    return sections.join("\n\n") || "No specific keywords extracted.";
}

export function _hasMonthInDates(data: Record<string, unknown>): boolean {
    for (const key of ["workExperience", "education", "personalProjects"]) {
        const entries = data[key];
        if (!Array.isArray(entries)) continue;
        for (const entry of entries) {
            if (typeof entry === "object" && entry !== null) {
                const years = (entry as Record<string, unknown>)["years"];
                if (typeof years === "string" && MONTH_PATTERN.test(years)) return true;
            }
        }
    }
    // Also check customSections itemList items
    const custom = data["customSections"];
    if (typeof custom === "object" && custom !== null) {
        for (const section of Object.values(custom as Record<string, unknown>)) {
            if (typeof section !== "object" || section === null) continue;
            const sec = section as Record<string, unknown>;
            if (sec["sectionType"] !== "itemList") continue;
            const items = sec["items"];
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (typeof item !== "object" || item === null) continue;
                const years = (item as Record<string, unknown>)["years"];
                if (typeof years === "string" && MONTH_PATTERN.test(years)) return true;
            }
        }
    }
    return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getArray(obj: Record<string, unknown>, key: string): Record<string, unknown>[] {
    const val = obj[key];
    return Array.isArray(val) ? val as Record<string, unknown>[] : [];
}

function getStringArray(obj: Record<string, unknown>, keys: string[]): string[] {
    let current: unknown = obj;
    for (const key of keys) {
        if (typeof current !== "object" || current === null) return [];
        current = (current as Record<string, unknown>)[key];
    }
    return Array.isArray(current) ? current.filter((s): s is string => typeof s === "string") : [];
}

function diffStringLists(
    changes: ResumeFieldDiff[],
    fieldPath: string,
    fieldType: ResumeFieldDiff["field_type"],
    origItems: string[],
    newItems: string[]
): void {
    const maxLen = Math.max(origItems.length, newItems.length);
    for (let i = 0; i < maxLen; i++) {
        const orig = origItems[i];
        const newItem = newItems[i];
        if (orig !== undefined && newItem !== undefined && orig !== newItem) {
            changes.push({ field_path: fieldPath, field_type: fieldType, change_type: "modified", original_value: orig, new_value: newItem, confidence: "medium" });
        } else if (orig === undefined && newItem !== undefined) {
            changes.push({ field_path: fieldPath, field_type: fieldType, change_type: "added", new_value: newItem, confidence: "medium" });
        } else if (orig !== undefined && newItem === undefined) {
            changes.push({ field_path: fieldPath, field_type: fieldType, change_type: "removed", original_value: orig, confidence: "low" });
        }
    }
}