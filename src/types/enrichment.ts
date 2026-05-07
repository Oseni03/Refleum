// src/types/enrichment.ts

export interface EnrichmentItem {
    item_id: string;   // e.g. "exp_0", "proj_1"
    item_type: "experience" | "project";
    title: string;
    subtitle?: string | null;
    current_description: string[];
    weakness_reason: string;
}

export interface EnrichmentQuestion {
    question_id: string; // e.g. "q_0"
    item_id: string;
    question: string;
    placeholder: string;
}

export interface AnalysisResponse {
    items_to_enrich: EnrichmentItem[];
    questions: EnrichmentQuestion[];
    analysis_summary?: string | null;
}

export interface AnswerInput {
    question_id: string;
    answer: string;
    item_id?: string | null;
    question_text?: string | null;
}

export interface EnhancedDescription {
    item_id: string;
    item_type: string;
    title: string;
    original_description: string[];
    enhanced_description: string[]; // NEW bullets to ADD (not replace existing)
}

export interface EnhancementPreview {
    enhancements: EnhancedDescription[];
}

export type RegenerateItemType = "experience" | "project" | "skills";

export interface RegenerateItemInput {
    item_id: string;
    item_type: RegenerateItemType;
    title: string;
    subtitle?: string | null;
    current_content: string[];
}

export interface RegeneratedItem {
    item_id: string;
    item_type: RegenerateItemType;
    title: string;
    subtitle?: string | null;
    original_content: string[];
    new_content: string[];
    diff_summary: string;
}

export interface RegenerateItemError {
    item_id: string;
    item_type: RegenerateItemType;
    title: string;
    subtitle?: string | null;
    message: string;
}

export interface RegenerateResponse {
    regenerated_items: RegeneratedItem[];
    errors: RegenerateItemError[];
}

// ─── Job Types ────────────────────────────────────────────────────────────────

export interface JobData {
    job_id: string;
    content: string;
    job_keywords?: Record<string, unknown> | null;
    job_keywords_hash?: string | null;
    preview_hash?: string | null;
    preview_hashes?: Record<string, string> | null;
    created_at: string;
    updated_at: string;
}

export type UploadJobsResult =
    | { success: true; jobIds: string[] }
    | {
        success: false;
        error: "UNAUTHORIZED" | "NO_JOBS_PROVIDED" | "EMPTY_JOB_DESCRIPTION";
    };

export type GetJobResult =
    | { success: true; data: JobData }
    | { success: false; error: "NOT_FOUND" | "UNAUTHORIZED" };

export type UpdateJobResult =
    | { success: true; jobId: string }
    | { success: false; error: "UNAUTHORIZED" | "NOT_FOUND" };

// ─── LLM Config Types ─────────────────────────────────────────────────────────

export type ReasoningEffort = "minimal" | "low" | "medium" | "high";
export type LlmProvider =
    | "openai"
    | "anthropic"
    | "gemini"
    | "openrouter"
    | "deepseek"
    | "ollama"
    | "openai_compatible";

export interface LlmConfigPayload {
    provider: LlmProvider | string;
    model: string;
    apiKey: string; // Masked for display
    apiBase?: string | null;
    reasoningEffort?: ReasoningEffort | null;
    enableCoverLetter: boolean;
    enableOutreachMessage: boolean;
    contentLanguage: string;
    defaultPromptId: string;
}

export type GetLlmConfigResult =
    | { success: true; data: LlmConfigPayload }
    | { success: false; error: "UNAUTHORIZED" };

export type UpdateLlmConfigResult =
    | { success: true }
    | { success: false; error: "UNAUTHORIZED" };

// ─── Refinement Types ─────────────────────────────────────────────────────────

export interface KeywordGapAnalysis {
    missing_keywords: string[];
    injectable_keywords: string[];     // In master resume — safe to add
    non_injectable_keywords: string[]; // Not in master — cannot add truthfully
    current_match_percentage: number;
    potential_match_percentage: number;
}

export type ViolationType =
    | "fabricated_skill"
    | "skill_variant"
    | "fabricated_cert"
    | "fabricated_company"
    | "invented_content";

export type ViolationSeverity = "critical" | "warning" | "info";

export interface AlignmentViolation {
    field_path: string;
    violation_type: ViolationType;
    value: string;
    severity: ViolationSeverity;
}

export interface AlignmentReport {
    is_aligned: boolean;
    violations: AlignmentViolation[];
    confidence_score: number; // 0.0–1.0
}

export interface RefinementResult {
    refined_data: Record<string, unknown>;
    passes_completed: number;
    keyword_analysis?: KeywordGapAnalysis | null;
    alignment_report?: AlignmentReport | null;
    ai_phrases_removed: string[];
    final_match_percentage: number;
}

export interface RefinementConfig {
    enable_keyword_injection: boolean;
    enable_ai_phrase_removal: boolean;
    enable_master_alignment_check: boolean;
    max_refinement_passes: number;
}

// ─── Prompt Options ───────────────────────────────────────────────────────────

export interface PromptOption {
    id: string;
    label: string;
    description: string;
}