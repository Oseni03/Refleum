// src/types/resume.ts
// Types Agent owns this file. Never define these inline in server/ or components/.

// ─── Section Types ────────────────────────────────────────────────────────────

export type SectionType = "personalInfo" | "text" | "itemList" | "stringList";
export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";
export type ContentType = "md" | "json";

// ─── Resume Data ──────────────────────────────────────────────────────────────

export interface PersonalInfo {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
}

export interface Experience {
    id: number;
    title: string;
    company: string;
    location?: string | null;
    years: string;
    description: string[];
}

export interface Education {
    id: number;
    institution: string;
    degree: string;
    years: string;
    description?: string | null;
}

export interface Project {
    id: number;
    name: string;
    role: string;
    years: string;
    github?: string | null;
    website?: string | null;
    description: string[];
}

export interface AdditionalInfo {
    technicalSkills: string[];
    languages: string[];
    certificationsTraining: string[];
    awards: string[];
}

export interface SectionMeta {
    id: string;
    key: string;
    displayName: string;
    sectionType: SectionType;
    isDefault: boolean;
    isVisible: boolean;
    order: number;
}

export interface CustomSectionItem {
    id: number;
    title: string;
    subtitle?: string | null;
    location?: string | null;
    years: string;
    description: string[];
}

export interface CustomSection {
    sectionType: SectionType;
    items?: CustomSectionItem[] | null;
    strings?: string[] | null;
    text?: string | null;
}

export interface ResumeData {
    personalInfo: PersonalInfo;
    summary: string;
    workExperience: Experience[];
    education: Education[];
    personalProjects: Project[];
    additional: AdditionalInfo;
    sectionMeta: SectionMeta[];
    customSections: Record<string, CustomSection>;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface RawResume {
    content: string;
    content_type: ContentType;
    created_at: string;
    processing_status: ProcessingStatus;
}

export interface ResumeFetchData {
    resume_id: string;
    raw_resume: RawResume;
    processed_resume?: ResumeData | null;
    cover_letter?: string | null;
    outreach_message?: string | null;
    parent_id?: string | null;
    title?: string | null;
}

export interface ResumeSummary {
    resume_id: string;
    filename?: string | null;
    is_master: boolean;
    parent_id?: string | null;
    processing_status: ProcessingStatus;
    created_at: string;
    updated_at: string;
    title?: string | null;
}

// ─── Improvement / Diff Types ─────────────────────────────────────────────────

export interface ImprovementSuggestion {
    suggestion: string;
    lineNumber?: number | null;
}

export type FieldType =
    | "skill"
    | "description"
    | "summary"
    | "certification"
    | "experience"
    | "education"
    | "project";

export type ChangeType = "added" | "removed" | "modified";
export type Confidence = "low" | "medium" | "high";

export interface ResumeFieldDiff {
    field_path: string;
    field_type: FieldType;
    change_type: ChangeType;
    original_value?: string | null;
    new_value?: string | null;
    confidence: Confidence;
}

export interface ResumeDiffSummary {
    total_changes: number;
    skills_added: number;
    skills_removed: number;
    descriptions_modified: number;
    certifications_added: number;
    high_risk_changes: number;
}

export interface RefinementStats {
    passes_completed: number;
    keywords_injected: number;
    ai_phrases_removed: string[];
    alignment_violations_fixed: number;
    initial_match_percentage: number;
    final_match_percentage: number;
}

export interface ImproveResumeData {
    request_id: string;
    resume_id?: string | null;
    job_id: string;
    resume_preview: ResumeData;
    improvements: ImprovementSuggestion[];
    markdownOriginal?: string | null;
    markdownImproved?: string | null;
    cover_letter?: string | null;
    outreach_message?: string | null;
    diff_summary?: ResumeDiffSummary | null;
    detailed_changes?: ResumeFieldDiff[] | null;
    refinement_stats?: RefinementStats | null;
    warnings: string[];
    refinement_attempted: boolean;
    refinement_successful: boolean;
}

export interface ImproveResumeResponse {
    request_id: string;
    data: ImproveResumeData;
}

// ─── Diff Change Types ────────────────────────────────────────────────────────

export type DiffAction = "replace" | "append" | "reorder";

export interface ResumeChange {
    path: string;
    action: DiffAction;
    original?: string | null;
    value: string | string[];
    reason: string;
}

export interface ImproveDiffResult {
    changes: ResumeChange[];
    strategy_notes: string;
}

// ─── Server Action Result Types ───────────────────────────────────────────────

export type GetResumeResult =
    | { success: true; data: ResumeFetchData }
    | { success: false; error: "NOT_FOUND" | "UNAUTHORIZED" };

export type ListResumesResult =
    | { success: true; data: ResumeSummary[] }
    | { success: false; error: "UNAUTHORIZED" };

export type CreateResumeResult =
    | {
        success: true;
        resumeId: string;
        isMaster: boolean;
        processingStatus: ProcessingStatus;
    }
    | { success: false; error: "UNAUTHORIZED" };

export type UpdateResumeResult =
    | { success: true; data: ResumeFetchData }
    | { success: false; error: "UNAUTHORIZED" | "NOT_FOUND" };

export type DeleteResumeResult =
    | { success: true }
    | { success: false; error: "UNAUTHORIZED" | "NOT_FOUND" };

export type UpdateCoverLetterResult =
    | { success: true }
    | { success: false; error: "UNAUTHORIZED" | "NOT_FOUND" };

export type UpdateTitleResult =
    | { success: true }
    | { success: false; error: "UNAUTHORIZED" | "NOT_FOUND" };

// ─── API Result Types ─────────────────────────────────────────────────────────

export interface JobKeywords {
    required_skills: string[];
    preferred_skills: string[];
    experience_requirements: string[];
    education_requirements: string[];
    key_responsibilities: string[];
    keywords: string[];
    experience_years?: number;
    seniority_level?: string;
}

export type TailorResumeResult =
    | { success: true; data: ImproveResumeData }
    | { success: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "PLAN_REQUIRED" | "INTERNAL_ERROR" | "EMPTY_JOB_DESCRIPTION" };

export type UploadResumeResult =
    | { success: true; resumeId: string; processingStatus: ProcessingStatus; filename: string }
    | { success: false; error: "UNAUTHORIZED" | "INTERNAL_ERROR" | "VALIDATION_ERROR" };
