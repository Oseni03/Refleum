// src/lib/resume-utils.ts
// Safety nets and utility functions for resume data manipulation.
// These are defense-in-depth guards that run on EVERY improve response.

import type { ResumeData, SectionMeta } from "@/types";

// ─── Default Section Metadata ─────────────────────────────────────────────────

export const DEFAULT_SECTION_META: SectionMeta[] = [
    { id: "personalInfo", key: "personalInfo", displayName: "Personal Info", sectionType: "personalInfo", isDefault: true, isVisible: true, order: 0 },
    { id: "summary", key: "summary", displayName: "Summary", sectionType: "text", isDefault: true, isVisible: true, order: 1 },
    { id: "workExperience", key: "workExperience", displayName: "Experience", sectionType: "itemList", isDefault: true, isVisible: true, order: 2 },
    { id: "education", key: "education", displayName: "Education", sectionType: "itemList", isDefault: true, isVisible: true, order: 3 },
    { id: "personalProjects", key: "personalProjects", displayName: "Projects", sectionType: "itemList", isDefault: true, isVisible: true, order: 4 },
    { id: "additional", key: "additional", displayName: "Skills & Awards", sectionType: "stringList", isDefault: true, isVisible: true, order: 5 },
];

export function normalizeResumeData(data: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...data };
    if (!normalized["sectionMeta"] || !Array.isArray(normalized["sectionMeta"]) || (normalized["sectionMeta"] as unknown[]).length === 0) {
        normalized["sectionMeta"] = structuredClone(DEFAULT_SECTION_META);
    }
    if (!normalized["customSections"]) {
        normalized["customSections"] = {};
    }
    return normalized;
}

// ─── Month Pattern ────────────────────────────────────────────────────────────

const MONTH_PATTERN =
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i;

function hasMonth(dateStr: string): boolean {
    return MONTH_PATTERN.test(dateStr);
}

// ─── Safety Net 1: Preserve Personal Info ────────────────────────────────────

export function preservePersonalInfo(
    originalData: Record<string, unknown> | null,
    improvedData: Record<string, unknown>
): { data: Record<string, unknown>; warnings: string[] } {
    const warnings: string[] = [];

    if (!originalData) {
        warnings.push("Original resume data unavailable - personal info may be AI-generated");
        return { data: improvedData, warnings };
    }

    const originalInfo = originalData["personalInfo"];
    if (typeof originalInfo !== "object" || originalInfo === null) {
        warnings.push("Original personal info missing or invalid");
        return { data: improvedData, warnings };
    }

    return {
        data: { ...improvedData, personalInfo: structuredClone(originalInfo) },
        warnings,
    };
}

// ─── Safety Net 2: Restore Original Dates ────────────────────────────────────

export function restoreOriginalDates(
    originalData: Record<string, unknown> | null,
    improvedData: Record<string, unknown>
): Record<string, unknown> {
    if (!originalData) return improvedData;

    const result = structuredClone(improvedData);

    for (const sectionKey of ["workExperience", "education", "personalProjects"] as const) {
        const origEntries = originalData[sectionKey];
        const resultEntries = result[sectionKey];
        if (!Array.isArray(origEntries) || !Array.isArray(resultEntries)) continue;

        for (let idx = 0; idx < origEntries.length; idx++) {
            if (idx >= resultEntries.length) break;
            const origEntry = origEntries[idx] as Record<string, unknown>;
            const resultEntry = resultEntries[idx] as Record<string, unknown>;
            if (typeof origEntry !== "object" || typeof resultEntry !== "object") continue;

            const origYears = origEntry["years"];
            const resultYears = resultEntry["years"];
            if (
                typeof origYears === "string" &&
                typeof resultYears === "string" &&
                origYears &&
                origYears !== resultYears &&
                hasMonth(origYears) &&
                !hasMonth(resultYears)
            ) {
                resultEntry["years"] = origYears;
            }
        }
    }

    return result;
}

// ─── Safety Net 3: Preserve Original Skills ──────────────────────────────────

export function preserveOriginalSkills(
    originalData: Record<string, unknown> | null,
    improvedData: Record<string, unknown>
): Record<string, unknown> {
    if (!originalData) return improvedData;

    const result = structuredClone(improvedData);
    const origAdditional = originalData["additional"];
    if (typeof origAdditional !== "object" || origAdditional === null) return result;

    const resultAdditional = (result["additional"] ?? {}) as Record<string, unknown>;
    const listFields = ["technicalSkills", "certificationsTraining", "languages", "awards"] as const;

    for (const field of listFields) {
        const origItems = (origAdditional as Record<string, unknown>)[field];
        if (!Array.isArray(origItems) || origItems.length === 0) continue;

        const currentItems: string[] = Array.isArray(resultAdditional[field])
            ? [...(resultAdditional[field] as string[])]
            : [];

        const currentLower = new Set(currentItems.map((s) => s.toLowerCase()));

        for (const item of origItems) {
            if (typeof item === "string" && !currentLower.has(item.toLowerCase())) {
                currentItems.push(item);
                currentLower.add(item.toLowerCase());
            }
        }

        resultAdditional[field] = currentItems;
    }

    result["additional"] = resultAdditional;
    return result;
}

// ─── Safety Net 4: Protect Custom Sections ───────────────────────────────────

export function protectCustomSections(
    originalData: Record<string, unknown> | null,
    improvedData: Record<string, unknown>
): Record<string, unknown> {
    if (!originalData) return improvedData;

    const origCustom = originalData["customSections"];
    if (typeof origCustom !== "object" || origCustom === null) return improvedData;

    const result = structuredClone(improvedData);
    const resultCustom = (result["customSections"] ?? {}) as Record<string, unknown>;

    for (const [sectionKey, origSection] of Object.entries(origCustom as Record<string, unknown>)) {
        if (typeof origSection !== "object" || origSection === null) continue;
        const origSectionObj = origSection as Record<string, unknown>;
        const resultSection = resultCustom[sectionKey];

        if (typeof resultSection !== "object" || resultSection === null) {
            resultCustom[sectionKey] = structuredClone(origSectionObj);
            continue;
        }

        const resultSectionObj = resultSection as Record<string, unknown>;
        if (origSectionObj["sectionType"] !== "itemList") continue;

        const origItems = origSectionObj["items"];
        const resultItems = resultSectionObj["items"];
        if (!Array.isArray(origItems) || !Array.isArray(resultItems)) continue;

        // Trim hallucinated extra items
        const trimmed = resultItems.slice(0, origItems.length) as Record<string, unknown>[];

        // Revert fabricated descriptions on items that had empty descriptions
        for (let idx = 0; idx < origItems.length; idx++) {
            if (idx >= trimmed.length) break;
            const origItem = origItems[idx] as Record<string, unknown>;
            const resultItem = trimmed[idx];
            if (!origItem || !resultItem) continue;

            const origDesc = origItem["description"];
            if (Array.isArray(origDesc) && origDesc.length === 0) {
                const resultDesc = resultItem["description"];
                if (Array.isArray(resultDesc) && resultDesc.length > 0) {
                    resultItem["description"] = [];
                }
            }
        }

        resultSectionObj["items"] = trimmed;
    }

    result["customSections"] = resultCustom;
    return result;
}

// ─── Safety Net 5: Validate Confirm Payload ──────────────────────────────────

export function validateConfirmPayload(
    originalData: Record<string, unknown> | null,
    improvedData: Record<string, unknown>
): { valid: boolean; error?: string } {
    if (!originalData) return { valid: true }; // Can't validate without original

    const originalInfo = originalData["personalInfo"] as Record<string, unknown> | undefined;
    const improvedInfo = improvedData["personalInfo"] as Record<string, unknown> | undefined;

    if (!originalInfo || !improvedInfo) {
        return { valid: false, error: "personalInfo missing from resume" };
    }

    const normalize = (v: unknown): string => {
        if (v === null || v === undefined) return "";
        if (typeof v === "string") return v.normalize("NFC").trim();
        return String(v);
    };

    const fields = new Set([...Object.keys(originalInfo), ...Object.keys(improvedInfo)]);
    const mismatches: string[] = [];

    for (const field of fields) {
        if (normalize(originalInfo[field]) !== normalize(improvedInfo[field])) {
            mismatches.push(field);
        }
    }

    if (mismatches.length > 0) {
        return { valid: false, error: `personalInfo fields changed: ${mismatches.join(", ")}` };
    }

    return { valid: true };
}

// ─── Date Restoration from Markdown ──────────────────────────────────────────

const MD_DATE_RE =
    /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4})(?:\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}|Present|Current|Now|Ongoing))?/gi;

export function restoreDatesFromMarkdown(
    parsedData: Record<string, unknown>,
    markdown: string
): Record<string, unknown> {
    const mdDates = markdown.match(MD_DATE_RE) ?? [];
    if (mdDates.length === 0) return parsedData;

    const yearOnlyRe = /\d{4}/g;
    const yearToFull: Record<string, string> = {};

    for (const mdDate of mdDates) {
        const years = mdDate.match(yearOnlyRe) ?? [];
        if (years.length > 0) {
            const key = years.join(" - ");
            if (!yearToFull[key]) {
                const normalized = mdDate.trim().replace(/\s*[-–—]\s*/g, " - ");
                yearToFull[key] = normalized;
            }
        }
    }

    if (Object.keys(yearToFull).length === 0) return parsedData;

    const result = structuredClone(parsedData);

    const patchEntry = (entry: unknown): void => {
        if (typeof entry !== "object" || entry === null) return;
        const entryObj = entry as Record<string, unknown>;
        const years = entryObj["years"];
        if (typeof years !== "string" || !years || hasMonth(years)) return;
        if (yearToFull[years]) entryObj["years"] = yearToFull[years];
    };

    for (const sectionKey of ["workExperience", "education", "personalProjects"]) {
        const entries = result[sectionKey];
        if (Array.isArray(entries)) entries.forEach(patchEntry);
    }

    // Custom sections (itemList)
    const custom = result["customSections"];
    if (typeof custom === "object" && custom !== null) {
        for (const section of Object.values(custom as Record<string, unknown>)) {
            if (typeof section !== "object" || section === null) continue;
            const sec = section as Record<string, unknown>;
            if (sec["sectionType"] !== "itemList") continue;
            const items = sec["items"];
            if (Array.isArray(items)) items.forEach(patchEntry);
        }
    }

    return result;
}

// ─── Preview Hash ─────────────────────────────────────────────────────────────

import { createHash } from "crypto";

function normalizePayload(value: unknown): unknown {
    if (typeof value === "string") return value.normalize("NFC");
    if (Array.isArray(value)) return value.map(normalizePayload);
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => [k.normalize("NFC"), normalizePayload(v)])
        );
    }
    return value;
}

export function hashImprovedData(data: Record<string, unknown>): string {
    const normalized = normalizePayload(data);
    const serialized = JSON.stringify(normalized);
    return createHash("sha256").update(serialized).digest("hex");
}

export function hashJobContent(content: string): string {
    return createHash("sha256").update(content).digest("hex");
}