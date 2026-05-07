# AI Resume Builder — Python FastAPI → Next.js Conversion Guide
> Complete technical reference for an AI code agent converting this FastAPI backend to Next.js 14+ App Router

---

## 1. PROJECT OVERVIEW

This is an **AI-powered resume builder backend** with these core capabilities:

| Capability | Description |
|---|---|
| Resume Upload & Parse | PDF/DOCX → Markdown → structured JSON via LLM |
| Resume Improvement | AI tailors resume to a job description using diff-based patching |
| Multi-pass Refinement | Keyword injection, AI phrase removal, alignment validation |
| Resume Enrichment | AI asks clarifying questions, adds bullet points |
| AI Regeneration | Rewrites selected sections based on user feedback |
| Cover Letter / Outreach | Generates cover letter and LinkedIn outreach message |
| Job Description Management | Stores JDs, extracts keywords |
| PDF Export | Headless Chromium rendering |

---

## 2. FILE MAP (Python → Next.js Route Targets)

```
Python File          → Next.js Route File(s)
─────────────────────────────────────────────────────────────────────
resumes.py           → app/api/resumes/route.ts
                       app/api/resumes/[id]/route.ts
                       app/api/resumes/[id]/pdf/route.ts
                       app/api/resumes/[id]/cover-letter/route.ts
                       app/api/resumes/[id]/cover-letter/pdf/route.ts
                       app/api/resumes/[id]/outreach-message/route.ts
                       app/api/resumes/[id]/generate-cover-letter/route.ts
                       app/api/resumes/[id]/generate-outreach/route.ts
                       app/api/resumes/[id]/retry-processing/route.ts
                       app/api/resumes/[id]/job-description/route.ts
                       app/api/resumes/[id]/title/route.ts
                       app/api/resumes/list/route.ts
                       app/api/resumes/improve/preview/route.ts
                       app/api/resumes/improve/confirm/route.ts
                       app/api/resumes/improve/route.ts

jobs.py              → app/api/jobs/route.ts
                       app/api/jobs/[id]/route.ts

enrichment.py        → app/api/enrichment/analyze/[resumeId]/route.ts
                       app/api/enrichment/enhance/route.ts
                       app/api/enrichment/apply/[resumeId]/route.ts
                       app/api/enrichment/regenerate/route.ts
                       app/api/enrichment/apply-regenerated/[resumeId]/route.ts

llm.py               → lib/llm.ts               (service, not a route)
improver.py          → lib/improver.ts           (service)
refiner.py           → lib/refiner.ts            (service)
cover_letter.py      → lib/cover-letter.ts       (service)
parser.py            → lib/parser.ts             (service)
models.py            → types/resume.ts           (TypeScript types)
enrichment(1).py     → lib/prompts/enrichment.ts (prompt templates)
enrichment(2).py     → types/enrichment.ts       (TypeScript types)
refinement.py        → lib/prompts/refinement.ts (prompt templates + blacklist)
refinement(1).py     → types/refinement.ts       (TypeScript types)
templates.py         → lib/prompts/templates.ts  (prompt templates)
```

---

## 3. COMPLETE TYPE DEFINITIONS (TypeScript)

### 3.1 Core Resume Types (`types/resume.ts`)

```typescript
// ─── Section Types ───────────────────────────────────────────────────────────
export type SectionType = 'personalInfo' | 'text' | 'itemList' | 'stringList';

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

// ─── API Response Types ───────────────────────────────────────────────────────
export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface RawResume {
  id?: number | null;
  content: string;
  content_type: string;
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

export interface ResumeFetchResponse {
  request_id: string;
  data: ResumeFetchData;
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

export interface ResumeListResponse {
  request_id: string;
  data: ResumeSummary[];
}

export interface ResumeUploadResponse {
  message: string;
  request_id: string;
  resume_id: string;
  processing_status: ProcessingStatus;
  is_master: boolean;
}

// ─── Improvement Types ────────────────────────────────────────────────────────
export interface ImprovementSuggestion {
  suggestion: string;
  lineNumber?: number | null;
}

export interface ResumeFieldDiff {
  field_path: string;
  field_type: 'skill' | 'description' | 'summary' | 'certification' | 'experience' | 'education' | 'project';
  change_type: 'added' | 'removed' | 'modified';
  original_value?: string | null;
  new_value?: string | null;
  confidence: 'low' | 'medium' | 'high';
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

// ─── Diff / Change Types ──────────────────────────────────────────────────────
export interface ResumeChange {
  path: string;
  action: 'replace' | 'append' | 'reorder';
  original?: string | null;
  value: string | string[];
  reason: string;
}

export interface ImproveDiffResult {
  changes: ResumeChange[];
  strategy_notes: string;
}

// ─── Config / Misc ────────────────────────────────────────────────────────────
export interface ImproveResumeRequest {
  resume_id: string;
  job_id: string;
  prompt_id?: string | null;
}

export interface ImproveResumeConfirmRequest {
  resume_id: string;
  job_id: string;
  improved_data: ResumeData;
  improvements: ImprovementSuggestion[];
}

export interface JobUploadRequest {
  job_descriptions: string[];
  resume_id?: string | null;
}

export interface JobUploadResponse {
  message: string;
  job_id: string[];
  request: Record<string, unknown>;
}
```

### 3.2 Enrichment Types (`types/enrichment.ts`)

```typescript
export interface EnrichmentItem {
  item_id: string;       // e.g. "exp_0", "proj_1"
  item_type: string;     // "experience" | "project"
  title: string;
  subtitle?: string | null;
  current_description: string[];
  weakness_reason: string;
}

export interface EnrichmentQuestion {
  question_id: string;   // e.g. "q_0"
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

export interface EnhanceRequest {
  resume_id: string;
  answers: AnswerInput[];
}

export interface EnhancedDescription {
  item_id: string;
  item_type: string;
  title: string;
  original_description: string[];
  enhanced_description: string[];  // NEW bullets to ADD (not replace)
}

export interface EnhancementPreview {
  enhancements: EnhancedDescription[];
}

export interface ApplyEnhancementsRequest {
  enhancements: EnhancedDescription[];
}

export type RegenerateItemType = 'experience' | 'project' | 'skills';

export interface RegenerateItemInput {
  item_id: string;
  item_type: RegenerateItemType;
  title: string;
  subtitle?: string | null;
  current_content: string[];
}

export interface RegenerateRequest {
  resume_id: string;
  items: RegenerateItemInput[];
  instruction: string;   // Max 2000 chars
  output_language: string;
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
```

### 3.3 Refinement Types (`types/refinement.ts`)

```typescript
export interface KeywordGapAnalysis {
  missing_keywords: string[];
  injectable_keywords: string[];      // In master resume — safe to add
  non_injectable_keywords: string[];  // Not in master — cannot add
  current_match_percentage: number;
  potential_match_percentage: number;
}

export interface AlignmentViolation {
  field_path: string;
  violation_type: 'fabricated_skill' | 'skill_variant' | 'fabricated_cert' | 'fabricated_company' | 'invented_content';
  value: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface AlignmentReport {
  is_aligned: boolean;
  violations: AlignmentViolation[];
  confidence_score: number;  // 0.0–1.0
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
```

---

## 4. ALL API ENDPOINTS

### 4.1 Resume Endpoints (`/api/resumes`)

#### `POST /api/resumes/upload`
**Purpose:** Upload PDF/DOCX, convert to Markdown, parse to JSON via LLM.

**Request:** `multipart/form-data` with field `file`

**Validation:**
- Allowed types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max size: 4MB
- Non-empty file required

**Response:** `ResumeUploadResponse`
```typescript
{
  message: string,
  request_id: string,
  resume_id: string,
  processing_status: 'pending' | 'processing' | 'ready' | 'failed',
  is_master: boolean
}
```

**Business Logic:**
1. Validate file type + size
2. Convert file to Markdown (markitdown library — use equivalent in Node.js, e.g. `pdf-parse` + `mammoth`)
3. Atomically create resume record as master if no master exists; set `processing_status: 'processing'`
4. Call LLM to parse markdown → structured JSON (`parse_resume_to_json`)
5. Patch year-only dates with month-inclusive dates from raw markdown
6. On success: update `processed_data`, `processing_status: 'ready'`
7. On LLM failure: update `processing_status: 'failed'`, still return 200

**Next.js Notes:**
- Use `request.formData()` to get the file
- Store the file in memory buffer (no disk write needed for LLM call)
- For PDF parsing: `pdf-parse` npm package
- For DOCX parsing: `mammoth` npm package

---

#### `GET /api/resumes?resume_id=<id>`
**Purpose:** Fetch a resume by ID.

**Query Params:** `resume_id: string` (required)

**Response:** `ResumeFetchResponse`

**Business Logic:**
1. Fetch from DB
2. Apply lazy migration: add `sectionMeta` if absent
3. Return raw content + structured data (if available)

---

#### `GET /api/resumes/list?include_master=false`
**Purpose:** List all resumes.

**Query Params:** `include_master: boolean` (default `false`)

**Response:** `ResumeListResponse`

**Business Logic:**
1. Fetch all resumes from DB
2. Filter out master unless `include_master=true`
3. Sort by `updated_at` descending

---

#### `PATCH /api/resumes/[id]`
**Purpose:** Update a resume with new structured data.

**Request Body:** `ResumeData`

**Response:** `ResumeFetchResponse`

---

#### `DELETE /api/resumes/[id]`
**Purpose:** Delete a resume.

**Response:** `{ message: string }`

---

#### `POST /api/resumes/[id]/retry-processing`
**Purpose:** Re-run LLM parsing on a failed resume.

**Allowed statuses:** `failed` or `processing` only (400 otherwise)

**Response:** `ResumeUploadResponse`

---

#### `POST /api/resumes/improve/preview`
**Purpose:** Preview a tailored resume WITHOUT saving it. Returns `resume_id: null`.

**Request Body:**
```typescript
{ resume_id: string; job_id: string; prompt_id?: string | null }
```

**Response:** `ImproveResumeResponse` (with `data.resume_id = null`)

**Business Logic (full pipeline):**
1. Fetch resume + job from DB
2. Extract/cache job keywords via LLM
3. If structured resume data exists → **diff-based flow**:
   - `generateResumeDiffs()` → targeted change list
   - `applyDiffs()` → apply with 4-gate verification
   - `verifyDiffResult()` → local quality checks
4. Else → **full-output flow**: `improveResume()` → full JSON from LLM
5. **Safety nets** (in order):
   - `_preservePersonalInfo()` — restore from original
   - `_restoreOriginalDates()` — restore month-precision dates
   - `restoreDatesFromMarkdown()` — patch from raw markdown
   - `_preserveOriginalSkills()` — restore dropped skills/certs
   - `_protectCustomSections()` — revert hallucinated custom section content
6. **Multi-pass refinement**:
   - Pass 1: Keyword injection (LLM call)
   - Pass 2: AI phrase removal (local, no LLM)
   - Pass 3: Master alignment validation (local)
7. Compute diff summary + detailed changes
8. Store preview hash in job record for confirm validation
9. Return preview (no DB save for resume)

**Timeout:** 240 seconds hard limit

---

#### `POST /api/resumes/improve/confirm`
**Purpose:** Persist a previewed tailored resume after user confirmation.

**Request Body:** `ImproveResumeConfirmRequest`

**Business Logic:**
1. Validate `personalInfo` unchanged from original (`_validateConfirmPayload`)
2. Verify preview hash matches stored hash (anti-tamper)
3. Calculate diff summary
4. Generate cover letter, outreach message, and title in parallel (if enabled)
5. Save tailored resume to DB
6. Save improvement record to DB

---

#### `POST /api/resumes/improve`
**Purpose:** Legacy single-step improve + save (same pipeline as preview+confirm).

**Returns:** Full `ImproveResumeResponse` with non-null `resume_id`

---

#### `GET /api/resumes/[id]/pdf`
**Purpose:** Generate PDF via headless Chromium.

**Query Params:**
```
template: string        (default: 'swiss-single')
pageSize: 'A4' | 'LETTER'
marginTop/Bottom/Left/Right: number (5-25mm)
sectionSpacing: number  (1-5)
itemSpacing: number     (1-5)
lineHeight: number      (1-5)
fontSize: number        (1-5)
headerScale: number     (1-5)
headerFont: 'serif' | 'sans-serif' | 'mono'
bodyFont: 'serif' | 'sans-serif' | 'mono'
compactMode: boolean
showContactIcons: boolean
accentColor: 'blue' | 'green' | 'orange' | 'red'
lang?: string
```

**Response:** `application/pdf` binary

---

#### `PATCH /api/resumes/[id]/cover-letter`
**Request Body:** `{ content: string }`

#### `PATCH /api/resumes/[id]/outreach-message`
**Request Body:** `{ content: string }`

#### `PATCH /api/resumes/[id]/title`
**Request Body:** `{ title: string }` — truncated to 80 chars

#### `POST /api/resumes/[id]/generate-cover-letter`
**Purpose:** On-demand cover letter generation for an existing tailored resume.
**Requirements:** Resume must have `parent_id` (be a tailored resume)
**Response:** `{ content: string, message: string }`

#### `POST /api/resumes/[id]/generate-outreach`
**Same pattern as generate-cover-letter but for outreach message.**

#### `GET /api/resumes/[id]/job-description`
**Returns:** `{ job_id: string, content: string }`

#### `GET /api/resumes/[id]/cover-letter/pdf`
**Query Params:** `pageSize, lang`
**Returns:** PDF binary of cover letter page

---

### 4.2 Job Endpoints (`/api/jobs`)

#### `POST /api/jobs`
**Request Body:**
```typescript
{ job_descriptions: string[]; resume_id?: string | null }
```

**Validation:** Non-empty array, each item non-empty string

**Response:**
```typescript
{ message: string; job_id: string[]; request: Record<string, unknown> }
```

**Business Logic:** For each JD string → create job record → return array of IDs

---

#### `GET /api/jobs/[id]`
**Returns:** Job object

---

### 4.3 Enrichment Endpoints (`/api/enrichment`)

#### `POST /api/enrichment/analyze/[resumeId]`
**Purpose:** AI analysis — identify weak resume items, generate questions.

**Response:** `AnalysisResponse`
```typescript
{
  items_to_enrich: EnrichmentItem[];
  questions: EnrichmentQuestion[];      // MAX 6 questions total
  analysis_summary?: string | null;
}
```

**Business Logic:**
1. Fetch resume + processed_data
2. Call LLM with `ANALYZE_RESUME_PROMPT`
3. Parse response into `EnrichmentItem[]` + `EnrichmentQuestion[]`

---

#### `POST /api/enrichment/enhance`
**Request Body:** `EnhanceRequest`
**Response:** `EnhancementPreview`

**Business Logic (two paths):**

**Fast path** (all answers carry `item_id` + item exists in resume):
- Extract item details directly from `processed_data` (no LLM re-analysis)
- Call LLM `ENHANCE_DESCRIPTION_PROMPT` per item in parallel
- Returns **additional_bullets** (NEW bullets to ADD, not replace existing)

**Legacy path** (answers only have `question_id`):
- Re-run full analysis LLM call to get question→item mapping
- Then same LLM enhancement call per item

---

#### `POST /api/enrichment/apply/[resumeId]`
**Request Body:** `ApplyEnhancementsRequest`

**Business Logic:**
- For each enhancement: **APPEND** new bullets to existing description (do NOT replace)
- Parse `item_id` like `"exp_0"` → index into `workExperience[0]`
- Parse `"proj_0"` → index into `personalProjects[0]`
- Save updated `processed_data` to DB

---

#### `POST /api/enrichment/regenerate`
**Request Body:** `RegenerateRequest`
**Response:** `RegenerateResponse`

**Business Logic:**
- Validate resume exists
- For each item in parallel:
  - `skills` type → `REGENERATE_SKILLS_PROMPT`
  - `experience` / `project` → `REGENERATE_ITEM_PROMPT`
- Return regenerated items + errors (non-fatal per-item errors)

---

#### `POST /api/enrichment/apply-regenerated/[resumeId]`
**Request Body:** `RegeneratedItem[]`

**Business Logic (safety-critical — all-or-nothing):**
1. For each item, find the target entry using:
   - Primary: index from `item_id` (e.g. `exp_0` → index 0) + metadata match + original content match
   - Fallback: search all entries by title/company match
2. Verify `original_content` still matches current DB content (409 if mismatch)
3. Apply all changes or reject all if ANY item fails to match
4. Save to DB

**Experience matching keys:** `title` + `company` + `description`
**Project matching keys:** `name` + `role` + `description`
**Skills:** `additional.technicalSkills`

---

## 5. CORE SERVICE LOGIC

### 5.1 LLM Service (`lib/llm.ts`)

**Key functions to implement:**

```typescript
// Primary completion (text response)
async function complete(
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number,
  temperature?: number,
): Promise<string>

// JSON completion (with retry logic)
async function completeJson(
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number,
  retries?: number,
): Promise<Record<string, unknown>>
```

**In Next.js, use the Anthropic SDK or OpenAI SDK directly:**

```typescript
import Anthropic from '@anthropic-ai/sdk';
// OR
import OpenAI from 'openai';
```

**Key behaviors to replicate:**
- JSON mode when model supports `response_format: { type: 'json_object' }`
- Retry logic (up to 3 attempts) for malformed JSON
- Temperature increases on retry: `[0.1, 0.3, 0.5, 0.7]`
- Strip `<think>...</think>` tags from reasoning models
- Extract JSON from markdown code blocks if present (`\`\`\`json...\`\`\``)
- `drop_params: true` — silently ignore unsupported params per model
- All LLM errors surface as 500 to the client

**Provider config (from `config.json` or env vars):**
```typescript
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'deepseek' | 'ollama' | 'openai_compatible';
  model: string;
  api_key: string;
  api_base?: string | null;
  reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high' | null;
}
```

---

### 5.2 Resume Improver (`lib/improver.ts`)

**Key exported functions:**

```typescript
// Extract keywords from job description via LLM
async function extractJobKeywords(jobDescription: string): Promise<Record<string, unknown>>

// Generate targeted diffs (preferred path when structured data exists)
async function generateResumeDiffs(params: {
  originalResume: string;       // raw markdown
  jobDescription: string;
  jobKeywords: Record<string, unknown>;
  language: string;
  promptId?: string;
  originalResumeData?: Record<string, unknown>;
}): Promise<ImproveDiffResult>

// Apply diffs with 4-gate verification
function applyDiffs(
  original: Record<string, unknown>,
  changes: ResumeChange[],
): [result: Record<string, unknown>, applied: ResumeChange[], rejected: ResumeChange[]]

// Local quality checks (no LLM)
function verifyDiffResult(
  original: Record<string, unknown>,
  result: Record<string, unknown>,
  appliedChanges: ResumeChange[],
  jobKeywords: Record<string, unknown>,
): string[]  // returns warnings

// Full-output fallback (when no structured data)
async function improveResume(params: {
  originalResume: string;
  jobDescription: string;
  jobKeywords: Record<string, unknown>;
  language: string;
  promptId?: string;
  originalResumeData?: Record<string, unknown>;
}): Promise<Record<string, unknown>>

// Compute diff between original and improved
function calculateResumeDiff(
  original: Record<string, unknown>,
  improved: Record<string, unknown>,
): [ResumeDiffSummary, ResumeFieldDiff[]]

// Generate human-readable improvement suggestions
function generateImprovements(jobKeywords: Record<string, unknown>): Array<{ suggestion: string; lineNumber: null }>
```

**4-Gate Diff Verification Logic:**
```
Gate 1: Path in allowed whitelist (summary, workExperience[i].description[j], personalProjects[i].description[j], additional.technicalSkills)
Gate 2: Path not blocked (personalInfo, customSections, sectionMeta, education fields, dates, company, title names)
Gate 3: Path resolves to actual value in the data
Gate 4 (replace only): original text matches actual value (case-insensitive)
```

**Prompt strategies** (`prompt_id`):
| ID | Behavior |
|---|---|
| `nudge` | Minimal edits, no new bullets |
| `keywords` | Weave in keywords, may rephrase bullets |
| `full` | Full tailoring, may add bullets elaborating existing work |

---

### 5.3 Multi-Pass Refiner (`lib/refiner.ts`)

**Three passes (in order):**

**Pass 1 — Keyword Injection (LLM call)**
- Find JD keywords missing from tailored resume
- Check which missing keywords exist in master resume (injectable)
- Call LLM to weave injectable keywords into existing bullets
- Validate result structure before accepting

**Pass 2 — AI Phrase Removal (local, no LLM)**
- Blacklist of ~50 overused AI phrases (spearheaded, leveraged, orchestrated, etc.)
- Replace with simpler alternatives (spearheaded → led, leveraged → used)
- Skip phrases that appear in the job description (JD-protected)
- Em-dash (—) is also in the blacklist → replace with ", "

**Pass 3 — Master Alignment Validation (local, no LLM)**
- Check all skills in tailored resume exist in master resume
- Check all certifications exist in master resume
- Check no new companies were added
- Critical violations → remove fabricated content
- Non-critical (skill_variant) → info only

```typescript
// Main entry point
async function refineResume(params: {
  initialTailored: Record<string, unknown>;
  masterResume: Record<string, unknown>;
  jobDescription: string;
  jobKeywords: Record<string, unknown>;
  config?: RefinementConfig;
}): Promise<RefinementResult>
```

**Keyword matching uses word boundaries** (not substring): `/\bpython\b/i` not `includes('python')`

---

### 5.4 Resume Parser (`lib/parser.ts`)

```typescript
// Convert PDF/DOCX buffer to Markdown
async function parseDocument(content: Buffer, filename: string): Promise<string>
// Node.js: use 'pdf-parse' for PDF, 'mammoth' for DOCX

// Parse markdown to structured JSON via LLM
async function parseResumeToJson(markdownText: string): Promise<Record<string, unknown>>

// Patch year-only dates with month-inclusive dates from raw markdown
function restoreDatesFromMarkdown(
  parsedData: Record<string, unknown>,
  markdown: string,
): Record<string, unknown>
```

**Date restoration logic:**
- Extract all month-prefixed date ranges from raw markdown (regex for Jan/Feb/.../Dec + year)
- Build lookup: `"2020 - 2021"` → `"Jun 2020 - Aug 2021"`
- Patch entries where LLM dropped the month

---

### 5.5 Cover Letter Service (`lib/cover-letter.ts`)

```typescript
async function generateCoverLetter(
  resumeData: Record<string, unknown>,
  jobDescription: string,
  language?: string,
): Promise<string>

async function generateOutreachMessage(
  resumeData: Record<string, unknown>,
  jobDescription: string,
  language?: string,
): Promise<string>

async function generateResumeTitle(
  jobDescription: string,
  language?: string,
): Promise<string>
// Returns format: "Role @ Company" (max 80 chars)
```

---

## 6. PROMPT TEMPLATES (Key Prompts Summary)

### 6.1 Prompt IDs and Templates (`lib/prompts/templates.ts`)

| Constant | Purpose |
|---|---|
| `PARSE_RESUME_PROMPT` | Parse markdown resume → JSON |
| `EXTRACT_KEYWORDS_PROMPT` | Extract keywords from JD |
| `IMPROVE_RESUME_PROMPT_NUDGE` | Light tailoring |
| `IMPROVE_RESUME_PROMPT_KEYWORDS` | Keyword-focused tailoring |
| `IMPROVE_RESUME_PROMPT_FULL` | Full tailoring |
| `DIFF_IMPROVE_PROMPT` | Diff-based tailoring (preferred) |
| `COVER_LETTER_PROMPT` | Cover letter generation |
| `OUTREACH_MESSAGE_PROMPT` | LinkedIn outreach generation |
| `GENERATE_TITLE_PROMPT` | "Role @ Company" title |

**All prompts use `{variable}` placeholders:**
```typescript
const prompt = IMPROVE_RESUME_PROMPT_FULL
  .replace('{job_description}', jobDescription)
  .replace('{job_keywords}', keywordsStr)
  .replace('{original_resume}', resumeInput)
  .replace('{schema}', IMPROVE_SCHEMA_EXAMPLE)
  .replace('{output_language}', outputLanguage)
  .replace('{critical_truthfulness_rules}', truthfulnessRules);
```

### 6.2 Prompt Injection Sanitization

Before using user input in prompts, sanitize these patterns:
```typescript
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?above/gi,
  /forget\s+(everything|all)/gi,
  /new\s+instructions?:/gi,
  /system\s*:/gi,
  /<\s*\/?\s*system\s*>/gi,
  /\[\s*INST\s*\]/gi,
  /\[\s*\/\s*INST\s*\]/gi,
];
// Replace matches with "[REDACTED]"
```

---

## 7. DATABASE SCHEMA

The Python code uses TinyDB (JSON file-based). For Next.js, replace with **Prisma + PostgreSQL** or **Drizzle + SQLite/PostgreSQL**.

### Tables / Collections:

**`resumes`**
```typescript
{
  resume_id: string;          // UUID
  content: string;            // Markdown or JSON string
  content_type: 'md' | 'json';
  filename?: string;
  is_master: boolean;
  parent_id?: string;         // FK to resumes.resume_id (for tailored resumes)
  processed_data?: Record<string, unknown>;  // Parsed ResumeData as JSON
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  original_markdown?: string; // Always preserved from upload
  cover_letter?: string;
  outreach_message?: string;
  title?: string;
  created_at: string;         // ISO timestamp
  updated_at: string;         // ISO timestamp
}
```

**`jobs`**
```typescript
{
  job_id: string;             // UUID
  content: string;            // Raw job description text
  resume_id?: string;         // FK to resumes
  job_keywords?: Record<string, unknown>;  // Cached extracted keywords
  job_keywords_hash?: string; // SHA256 of content for cache invalidation
  preview_hash?: string;      // Latest preview hash
  preview_hashes?: Record<string, string>; // prompt_id → hash map
  created_at: string;
  updated_at: string;
}
```

**`improvements`**
```typescript
{
  improvement_id: string;     // UUID
  original_resume_id: string; // FK to resumes
  tailored_resume_id: string; // FK to resumes
  job_id: string;             // FK to jobs
  improvements: Array<{ suggestion: string; lineNumber: null }>;
  created_at: string;
}
```

**Special queries needed:**
```typescript
// Get the single master resume (is_master = true)
db.getMasterResume(): Resume | null

// Get improvement record for a tailored resume
db.getImprovementByTailoredResume(tailoredResumeId: string): Improvement | null

// Atomic master assignment (if no master exists, set this one as master)
db.createResumeAtomicMaster(data): Resume
```

---

## 8. SAFETY NETS (Critical Business Logic)

These 5 functions run on EVERY improve response. They are defense-in-depth and must be implemented:

### 8.1 `_preservePersonalInfo(originalData, improvedData)`
- Always restore `personalInfo` from the original resume
- The LLM is instructed to skip personalInfo, but this is a hard override
- Returns warnings if original data unavailable

### 8.2 `_restoreOriginalDates(originalData, improvedData)`
- Compare `years` field for each entry in workExperience, education, personalProjects
- If original has month precision ("Jun 2020 - Aug 2021") and improved lost it ("2020 - 2021") → restore original
- Also applies to custom sections itemList

### 8.3 `_preserveOriginalSkills(originalData, improvedData)`
- For each list in `additional` (technicalSkills, certificationsTraining, languages, awards):
- If any original item is missing from improved → append it back
- Case-insensitive comparison
- This ensures the LLM can never remove existing skills/certifications

### 8.4 `_protectCustomSections(originalData, improvedData)`
- If original custom section item had `description: []` → revert any LLM-generated description back to `[]`
- If LLM added extra items to a custom section → trim back to original count
- If LLM removed a custom section → restore the original section

### 8.5 `_validateConfirmPayload(originalData, improvedData)`
- On confirm endpoint only
- Verify all personalInfo fields unchanged between preview and confirm
- Throw 400 if any personalInfo field changed

---

## 9. PREVIEW HASH VALIDATION

Prevents tampering between preview and confirm:

```typescript
function hashImprovedData(data: Record<string, unknown>): string {
  // 1. Unicode NFC normalize all strings
  // 2. JSON.stringify with sort_keys=true, no spaces
  // 3. SHA256 hash
  const normalized = normalizePayload(data); // recursive NFC normalize
  const serialized = JSON.stringify(normalized, Object.keys(normalized).sort());
  return sha256(serialized);
}
```

**Flow:**
1. Preview → compute hash → store in `job.preview_hashes[prompt_id]`
2. Confirm → recompute hash from request body → must match any stored hash

---

## 10. LANGUAGE SUPPORT

All LLM-generated text can be in different languages:

```typescript
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  pt: 'Brazilian Portuguese',
};
```

The `output_language` is injected into every LLM prompt. Language comes from app config (`content_language` setting).

---

## 11. NEXT.JS ROUTE HANDLER PATTERNS

### Basic GET with query param:
```typescript
// app/api/resumes/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const resumeId = request.nextUrl.searchParams.get('resume_id');
  if (!resumeId) {
    return NextResponse.json({ detail: 'resume_id is required' }, { status: 400 });
  }
  try {
    const resume = await db.getResume(resumeId);
    if (!resume) return NextResponse.json({ detail: 'Resume not found' }, { status: 404 });
    return NextResponse.json({ request_id: crypto.randomUUID(), data: resume });
  } catch (e) {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
```

### File Upload:
```typescript
// app/api/resumes/upload/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ detail: 'No file provided' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length > 4 * 1024 * 1024) {
    return NextResponse.json({ detail: 'File too large' }, { status: 413 });
  }
  // ... process
}
```

### Dynamic Route:
```typescript
// app/api/resumes/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // ...
}
```

### Streaming timeout:
```typescript
// Wrap with AbortController for timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 240_000);
try {
  const result = await improveResumeFlow(/* ..., */ { signal: controller.signal });
  clearTimeout(timeoutId);
  return NextResponse.json(result);
} catch (e) {
  if (e instanceof Error && e.name === 'AbortError') {
    return NextResponse.json({ detail: 'Request timed out' }, { status: 504 });
  }
  throw e;
}
```

---

## 12. DEFAULT SECTION METADATA

When a resume has no `sectionMeta`, inject this default:

```typescript
export const DEFAULT_SECTION_META: SectionMeta[] = [
  { id: 'personalInfo', key: 'personalInfo', displayName: 'Personal Info', sectionType: 'personalInfo', isDefault: true, isVisible: true, order: 0 },
  { id: 'summary',      key: 'summary',      displayName: 'Summary',       sectionType: 'text',         isDefault: true, isVisible: true, order: 1 },
  { id: 'workExperience', key: 'workExperience', displayName: 'Experience', sectionType: 'itemList',     isDefault: true, isVisible: true, order: 2 },
  { id: 'education',    key: 'education',    displayName: 'Education',     sectionType: 'itemList',     isDefault: true, isVisible: true, order: 3 },
  { id: 'personalProjects', key: 'personalProjects', displayName: 'Projects', sectionType: 'itemList',  isDefault: true, isVisible: true, order: 4 },
  { id: 'additional',   key: 'additional',   displayName: 'Skills & Awards', sectionType: 'stringList', isDefault: true, isVisible: true, order: 5 },
];

export function normalizeResumeData(data: Partial<ResumeData>): ResumeData {
  if (!data.sectionMeta || data.sectionMeta.length === 0) {
    data.sectionMeta = structuredClone(DEFAULT_SECTION_META);
  }
  if (!data.customSections) {
    data.customSections = {};
  }
  return data as ResumeData;
}
```

---

## 13. AI PHRASE BLACKLIST (for Refinement Pass 2)

The following phrases must be replaced in resume content (case-insensitive):

```typescript
export const AI_PHRASE_REPLACEMENTS: Record<string, string> = {
  'spearheaded': 'led',
  'orchestrated': 'coordinated',
  'championed': 'advocated for',
  'synergized': 'collaborated',
  'leveraged': 'used',
  'revolutionized': 'transformed',
  'pioneered': 'introduced',
  'catalyzed': 'initiated',
  'operationalized': 'implemented',
  'architected': 'designed',
  'facilitated': 'helped',
  'utilized': 'used',
  'synergy': 'collaboration',
  'paradigm shift': 'change',
  'best-in-class': 'top-performing',
  'cutting-edge': 'modern',
  'game-changing': 'innovative',
  'holistic': 'comprehensive',
  'robust': 'strong',
  'impactful': 'effective',
  'proactively': 'actively',
  'stakeholder': 'team member',
  'deliverables': 'outputs',
  'in order to': 'to',
  'moving forward': '',
  'going forward': '',
  'at the end of the day': '',
  'on a daily basis': 'daily',
  'in a timely manner': 'promptly',
  'due to the fact that': 'because',
  '\u2014': ', ',   // Em-dash
  '---': ', ',
  '--': ', ',
  // ... (full list in refinement.py AI_PHRASE_REPLACEMENTS)
};
```

**Important:** Skip replacement if the phrase appears in the job description (JD-protected).

---

## 14. RECOMMENDED NEXT.JS PROJECT STRUCTURE

```
app/
  api/
    resumes/
      route.ts                    # GET list, POST upload
      [id]/
        route.ts                  # GET, PATCH, DELETE
        pdf/route.ts
        cover-letter/
          route.ts                # PATCH
          pdf/route.ts
        outreach-message/route.ts
        generate-cover-letter/route.ts
        generate-outreach/route.ts
        retry-processing/route.ts
        job-description/route.ts
        title/route.ts
    jobs/
      upload/route.ts
      [id]/route.ts
    enrichment/
      analyze/[resumeId]/route.ts
      enhance/route.ts
      apply/[resumeId]/route.ts
      regenerate/route.ts
      apply-regenerated/[resumeId]/route.ts
    resumes/
      improve/
        preview/route.ts
        confirm/route.ts
        route.ts                  # Legacy single-step

lib/
  llm.ts                          # LLM client wrapper
  improver.ts                     # Diff generation, application, verification
  refiner.ts                      # Multi-pass refinement
  parser.ts                       # Document parsing
  cover-letter.ts                 # Cover letter / outreach / title generation
  db.ts                           # Database client (Prisma/Drizzle)
  hash.ts                         # SHA256 + preview hash utilities
  prompts/
    templates.ts                  # All prompt templates
    enrichment.ts                 # Enrichment-specific prompts
    refinement.ts                 # Refinement prompts + blacklist

types/
  resume.ts                       # Core resume types
  enrichment.ts                   # Enrichment types
  refinement.ts                   # Refinement types

prisma/
  schema.prisma                   # DB schema
```

---

## 15. CRITICAL IMPLEMENTATION NOTES FOR CODE AGENT

1. **All LLM text generation must go through the `completeJson()` or `complete()` wrappers** — never call the SDK directly from route handlers.

2. **The improve pipeline is async-heavy** — use `Promise.all()` for parallel cover letter / outreach / title generation (same as Python's `asyncio.gather()`).

3. **Preview hash is security-critical** — confirm endpoint must reject requests where hash doesn't match.

4. **Safety nets run in exact order** — do not reorder steps 5.1–5.4 in the improve pipeline.

5. **Keyword matching uses word boundaries** — use `/\bkeyword\b/i` regex, not `String.includes()`.

6. **Date restoration is a two-step process** — first `_restoreOriginalDates()` (compare to original structured data), then `restoreDatesFromMarkdown()` (compare to raw markdown text).

7. **Enrichment apply is ADDITIVE** — `enhanced_description` contains new bullets to APPEND to `description`, not replace.

8. **Regeneration apply is ALL-OR-NOTHING** — if any item can't be matched, reject the entire batch with 409.

9. **The master resume is special** — it's the ground truth for alignment validation. If no master exists, use the current resume as its own master.

10. **Job keywords are cached with a content hash** — re-extract only if `SHA256(job.content) !== job.job_keywords_hash`.
