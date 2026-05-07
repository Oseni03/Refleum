# AI Resume Builder — Product Requirements Document

**Version:** 2.0
**Status:** Draft
**Last Updated:** May 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas](#3-user-personas)
4. [Feature Scope](#4-feature-scope)
5. [Functional Requirements](#5-functional-requirements)
6. [API Endpoints](#6-api-endpoints)
7. [Data Models](#7-data-models)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Technical Architecture](#9-technical-architecture)
10. [Error Handling & Edge Cases](#10-error-handling--edge-cases)
11. [Out of Scope](#11-out-of-scope)

---

## 1. Project Overview

The AI Resume Builder is a web application that helps job seekers tailor their resume to specific job descriptions using AI. Users upload their master resume once, paste in a job description, and receive a tailored version that is optimized for that role — complete with keyword alignment, an optional cover letter, and a LinkedIn outreach message.

The core philosophy is **truthfulness over performance**: the AI may only rephrase and reorder what already exists on the resume. It must never fabricate skills, certifications, employers, or metrics that the user has not claimed.

### What the App Does

| Capability | Description |
|---|---|
| **Resume Upload & Parse** | User uploads a PDF or DOCX. The app converts it to Markdown, then uses an LLM to parse it into a structured JSON resume. |
| **Resume Tailoring** | User submits a job description. The AI generates a targeted diff (a list of specific changes) rather than rewriting the whole resume. Changes are verified, safety-checked, and applied. |
| **Multi-Pass Refinement** | The tailored resume is automatically improved through three sequential passes: keyword injection, AI phrase removal, and alignment validation against the master resume. |
| **Cover Letter & Outreach** | Optionally generates a short cover letter and a LinkedIn cold outreach message, both tuned to the job description. |
| **Job Description Management** | Job descriptions are stored and their keywords are extracted and cached for reuse. |
| **PDF Export** | The final resume or cover letter can be downloaded as a formatted PDF with customizable layout settings. |

---

## 2. Goals & Success Metrics

### Product Goals

- Reduce the time a user spends tailoring a resume from ~45 minutes to under 3 minutes.
- Ensure every AI-generated change is grounded in the user's real experience.
- Produce resumes that pass ATS (Applicant Tracking System) keyword filters.
- Maintain a professional, human tone — not an obviously AI-written one.

### Success Metrics

| Metric | Target |
|---|---|
| Time from job paste → tailored resume preview | < 30 seconds |
| Keyword match improvement after tailoring | ≥ 20 percentage points |
| AI phrase detection & removal rate | ≥ 90% of blacklisted phrases removed |
| Alignment violation false-positive rate | < 5% (no real skills incorrectly removed) |
| Tailoring pipeline error rate | < 1% of requests |
| PDF export success rate | > 99% |

---

## 3. User Personas

### Primary: The Active Job Seeker
- Applying to 5–15 jobs per week
- Has one strong "master" resume
- Knows they need to tailor it per role but finds it tedious
- Not necessarily technical
- Wants fast results they can trust

### Secondary: The Career Switcher
- Transitioning from one field to another
- Resume may not perfectly match job description language
- Needs help translating transferable skills into the language of the new industry

### Tertiary: The Passive Candidate
- Not actively applying but open to opportunities
- Wants a polished, ready-to-send resume and cover letter for when the right role appears

---

## 4. Feature Scope

### In Scope

| # | Feature | Priority |
|---|---|---|
| 1 | Resume upload (PDF, DOCX) | P0 |
| 2 | LLM-based resume parsing to structured JSON | P0 |
| 3 | Job description upload and keyword extraction | P0 |
| 4 | AI resume tailoring (diff-based) | P0 |
| 5 | Preview before saving | P0 |
| 6 | Confirm and persist tailored resume | P0 |
| 7 | Multi-pass refinement (keywords, AI phrases, alignment) | P0 |
| 8 | Cover letter generation | P1 |
| 9 | LinkedIn outreach message generation | P1 |
| 10 | PDF export (resume + cover letter) | P1 |
| 11 | Resume list and management | P1 |
| 12 | Manual resume editing (structured editor) | P2 |
| 13 | Multi-language support (EN, ES, ZH, JA, PT) | P2 |
| 14 | Retry failed LLM parsing | P2 |

### Out of Scope (v2.0)

- Resume enrichment (AI asking clarifying questions to add new bullet points)
- AI section regeneration (rewriting selected sections from user feedback)
- User authentication / multi-user accounts
- Resume version history / git-like diffing UI
- ATS score simulation
- Job application tracking

---

## 5. Functional Requirements

### 5.1 Resume Upload & Parsing

**FR-001** — The system must accept PDF and DOCX files up to 4MB.

**FR-002** — On upload, the file must be converted to Markdown using a document parser (markitdown or equivalent).

**FR-003** — The Markdown must be sent to an LLM to extract a structured JSON resume conforming to the `ResumeData` schema.

**FR-004** — If LLM parsing fails, the resume must be stored with `processing_status: "failed"` and the user must be able to trigger a retry.

**FR-005** — The first resume uploaded must be designated as the **master resume**. The master resume is the ground truth for alignment validation. Only one master resume exists at a time.

**FR-006** — Date fields (e.g. "Jun 2020 – Aug 2021") must be preserved with month precision. If the LLM drops months during parsing, the system must restore them by cross-referencing the raw Markdown.

**FR-007** — The original Markdown must be permanently stored alongside the structured data, as it is used for date restoration in later steps.

---

### 5.2 Job Description Management

**FR-010** — Users must be able to submit one or more job descriptions as plain text.

**FR-011** — Each job description must be stored and assigned a unique ID.

**FR-012** — Keywords must be extracted from the job description using an LLM and cached. The cache must be invalidated if the job description content changes (using a SHA-256 content hash).

**FR-013** — Extracted keywords must be categorized as: `required_skills`, `preferred_skills`, `keywords`, `key_responsibilities`, and metadata like `experience_years` and `seniority_level`.

---

### 5.3 Resume Tailoring

The tailoring pipeline runs in a strict sequence. Steps must not be reordered.

#### Step 1: Keyword Extraction
The job's keywords are loaded from cache or freshly extracted (FR-012).

#### Step 2: Diff Generation
**FR-020** — The system must use an LLM to generate a **targeted diff** — a list of specific changes to make to the resume — rather than rewriting the entire document.

**FR-021** — Each diff change must specify: a `path` (e.g. `workExperience[0].description[2]`), an `action` (`replace`, `append`, or `reorder`), the `original` text at that path (for verification), the `value` (new content), and a `reason`.

**FR-022** — Three tailoring strategies must be available, selectable by `prompt_id`:
- **nudge** — Minimal edits only where there is a clear, existing match.
- **keywords** — Reword existing bullets to include JD keywords.
- **full** — Comprehensive tailoring; may add new bullets that elaborate on existing work.

**FR-023** — A default strategy must be configurable by the administrator.

#### Step 3: Diff Application & Verification
**FR-024** — Before applying any diff, the system must verify it against a whitelist of allowed paths. Changes to `personalInfo`, `education`, `customSections`, dates, company names, or degree fields must be rejected.

**FR-025** — For `replace` actions, the system must verify that the `original` field in the diff exactly matches the current text at that path (case-insensitive). Mismatches must be rejected.

**FR-026** — For `reorder` actions, the system must verify the reordered list contains exactly the same items as the original (case-insensitive set equality).

**FR-027** — All rejected changes must be logged and counted. The count must be included in the API response.

#### Step 4: Safety Nets
The following safety nets run after diff application, in this exact order:

**FR-028** — **Preserve Personal Info:** The `personalInfo` block (name, email, phone, etc.) must always be restored from the original master resume, regardless of what the LLM returned.

**FR-029** — **Restore Dates:** Any date field that lost month precision (e.g., "Jun 2020" became "2020") must be restored from the original structured data, then from the raw Markdown.

**FR-030** — **Preserve Skills:** Any skill, certification, language, or award present in the original resume that was dropped by the LLM must be appended back to the relevant list.

**FR-031** — **Protect Custom Sections:** Custom sections must maintain their original structure. Items the LLM added beyond the original count must be trimmed. If an item originally had an empty description (`[]`), any LLM-generated description for it must be reverted to `[]`.

#### Step 5: Multi-Pass Refinement
See Section 5.4.

#### Step 6: Preview & Confirm
**FR-032** — The system must support a **preview** flow where the tailored resume is returned to the user but not persisted. `resume_id` is `null` in the preview response.

**FR-033** — A SHA-256 hash of the preview's resume data must be computed and stored on the job record (`preview_hashes[prompt_id]`).

**FR-034** — The **confirm** endpoint must recompute the hash of the submitted resume data and reject the request (HTTP 400) if it does not match any stored preview hash for that job. This prevents the client from submitting arbitrary data as a confirmed resume.

**FR-035** — On confirm, a new tailored resume record must be persisted with a link to the original master resume (`parent_id`) and the job (`job_id`).

**FR-036** — The tailoring pipeline must time out after 240 seconds and return HTTP 504.

---

### 5.4 Multi-Pass Refinement

Refinement runs automatically after the safety nets in the tailoring pipeline. It consists of up to three passes.

#### Pass 1 — Keyword Injection

**FR-040** — The system must identify keywords present in the job description that are missing from the tailored resume.

**FR-041** — Missing keywords must be split into two groups:
- **Injectable:** Keywords that exist in the master resume. These are safe to add.
- **Non-injectable:** Keywords not in the master resume. These must never be added.

**FR-042** — Injectable keywords must be woven into the tailored resume via a second LLM call, with the master resume provided as the source of truth.

**FR-043** — Keyword matching must use **whole-word boundary matching** (`\bkeyword\b`), not substring matching, to avoid false positives (e.g., "Go" matching "Google").

**FR-044** — The keyword match percentage before and after refinement must be computed and included in the API response.

#### Pass 2 — AI Phrase Removal

**FR-045** — The system must scan all text fields in the tailored resume and replace blacklisted AI-sounding phrases with simpler alternatives.

**FR-046** — The blacklist must include at minimum: overused action verbs (`spearheaded`, `orchestrated`, `leveraged`, `utilized`, `facilitated`), corporate buzzwords (`synergy`, `cutting-edge`, `holistic`, `robust`, `impactful`, `stakeholder`), filler phrases (`in order to`, `moving forward`, `at the end of the day`), and em-dashes (`—`, `---`, `--`).

**FR-047** — If a blacklisted phrase appears in the job description, it must be **protected** and not removed, since the employer used it intentionally.

**FR-048** — This pass must be a local operation with no LLM call.

#### Pass 3 — Alignment Validation

**FR-049** — The system must compare the tailored resume's skills, certifications, and employer names against the master resume.

**FR-050** — Violations must be classified by severity:
- **Critical:** Fabricated skill not in master → must be removed.
- **Critical:** Fabricated certification not in master → must be removed.
- **Critical:** Fabricated employer not in master → the entire work experience entry must be removed.
- **Info:** Skill variant (e.g., "Python" vs "Python 3.x") → logged only, not removed.

**FR-051** — All critical violations must be automatically corrected before the response is returned.

**FR-052** — Refinement stats (`passes_completed`, `keywords_injected`, `ai_phrases_removed`, `alignment_violations_fixed`, `initial_match_percentage`, `final_match_percentage`) must be included in every tailoring API response.

---

### 5.5 Cover Letter & Outreach Generation

**FR-060** — Cover letter and outreach generation must be feature-flag controlled (off by default).

**FR-061** — When enabled, both must be generated in parallel (not sequentially) on the confirm step, alongside the resume title.

**FR-062** — The cover letter must be 100–150 words across 3–4 paragraphs. It must reference a specific detail from the job description and match 1–2 qualifications from the resume to stated requirements.

**FR-063** — The outreach message must be 70–100 words. It must open with a specific reference to the job description, not a generic opener.

**FR-064** — Both must avoid em-dashes and the following phrases: "excited about", "passionate about", "I'm reaching out", "I saw your posting".

**FR-065** — Both must be editable by the user after generation via PATCH endpoints.

**FR-066** — Both must be generatable on-demand for existing tailored resumes via dedicated POST endpoints (for resumes created before the feature was enabled).

**FR-067** — A short title (max 60 characters, format: "Role @ Company") must always be generated from the job description and saved with the tailored resume.

---

### 5.6 PDF Export

**FR-070** — The system must render resume PDFs using headless Chromium by navigating to the app's print page.

**FR-071** — Supported page sizes: A4 and US Letter.

**FR-072** — The following layout parameters must be accepted: `marginTop`, `marginBottom`, `marginLeft`, `marginRight` (5–25mm), `sectionSpacing`, `itemSpacing`, `lineHeight`, `fontSize`, `headerScale` (all 1–5 scale).

**FR-073** — Typography options must include: `headerFont` and `bodyFont` (serif, sans-serif, mono), `accentColor` (blue, green, orange, red), `compactMode` (boolean), and `showContactIcons` (boolean).

**FR-074** — Cover letter PDFs must be exported from a separate print page using the `.cover-letter-print` CSS selector.

**FR-075** — PDF generation failures must return HTTP 503, not 500.

---

### 5.7 Resume Management

**FR-080** — The system must support listing all resumes, with an optional flag to include the master resume.

**FR-081** — The list must be sorted by `updated_at` descending (most recent first).

**FR-082** — Each resume in the list must expose: `resume_id`, `filename`, `is_master`, `parent_id`, `processing_status`, `created_at`, `updated_at`, and `title`.

**FR-083** — Any resume may be deleted by ID.

**FR-084** — Resumes with `processing_status: "failed"` or `"processing"` may be retried via a dedicated endpoint.

**FR-085** — The user must be able to retrieve the original job description used to tailor any tailored resume.

---

### 5.8 Language Support

**FR-090** — All LLM-generated text (resume bullets, summary, cover letter, outreach, title) must be produced in the configured content language.

**FR-091** — Supported languages: English (`en`), Spanish (`es`), Chinese Simplified (`zh`), Japanese (`ja`), Brazilian Portuguese (`pt`).

**FR-092** — Language is configured globally in app settings, not per-request.

---

## 6. API Endpoints

### Resumes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/resumes/upload` | Upload PDF/DOCX, parse to JSON |
| `GET` | `/api/resumes?resume_id=` | Fetch single resume |
| `GET` | `/api/resumes/list?include_master=` | List all resumes |
| `PATCH` | `/api/resumes/{id}` | Update structured resume data |
| `DELETE` | `/api/resumes/{id}` | Delete a resume |
| `POST` | `/api/resumes/improve/preview` | Preview tailored resume (not saved) |
| `POST` | `/api/resumes/improve/confirm` | Confirm and save tailored resume |
| `POST` | `/api/resumes/improve` | Legacy: single-step tailor + save |
| `GET` | `/api/resumes/{id}/pdf` | Download resume as PDF |
| `GET` | `/api/resumes/{id}/cover-letter/pdf` | Download cover letter as PDF |
| `PATCH` | `/api/resumes/{id}/cover-letter` | Update cover letter text |
| `PATCH` | `/api/resumes/{id}/outreach-message` | Update outreach message text |
| `PATCH` | `/api/resumes/{id}/title` | Update resume title |
| `POST` | `/api/resumes/{id}/generate-cover-letter` | On-demand cover letter generation |
| `POST` | `/api/resumes/{id}/generate-outreach` | On-demand outreach message generation |
| `POST` | `/api/resumes/{id}/retry-processing` | Retry failed LLM parsing |
| `GET` | `/api/resumes/{id}/job-description` | Get JD used to tailor this resume |

### Jobs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/jobs` | Store one or more job descriptions |
| `GET` | `/api/jobs/{id}` | Retrieve a job description by ID |

---

## 7. Data Models

### ResumeData

```typescript
interface ResumeData {
  personalInfo: {
    name: string; title: string; email: string; phone: string;
    location: string; website?: string; linkedin?: string; github?: string;
  };
  summary: string;
  workExperience: Array<{
    id: number; title: string; company: string;
    location?: string; years: string; description: string[];
  }>;
  education: Array<{
    id: number; institution: string; degree: string;
    years: string; description?: string;
  }>;
  personalProjects: Array<{
    id: number; name: string; role: string; years: string;
    github?: string; website?: string; description: string[];
  }>;
  additional: {
    technicalSkills: string[]; languages: string[];
    certificationsTraining: string[]; awards: string[];
  };
  sectionMeta: SectionMeta[];
  customSections: Record<string, CustomSection>;
}
```

### Resume Record (Database)

| Field | Type | Notes |
|---|---|---|
| `resume_id` | `string` | UUID |
| `content` | `string` | Raw Markdown or JSON string |
| `content_type` | `"md" \| "json"` | |
| `original_markdown` | `string` | Always the original uploaded Markdown |
| `processed_data` | `object` | Parsed `ResumeData` JSON |
| `processing_status` | `"pending" \| "processing" \| "ready" \| "failed"` | |
| `is_master` | `boolean` | Only one master exists |
| `parent_id` | `string \| null` | Set on tailored resumes |
| `filename` | `string` | Original upload filename |
| `cover_letter` | `string \| null` | |
| `outreach_message` | `string \| null` | |
| `title` | `string \| null` | "Role @ Company" |
| `created_at` | `string` | ISO timestamp |
| `updated_at` | `string` | ISO timestamp |

### Job Record (Database)

| Field | Type | Notes |
|---|---|---|
| `job_id` | `string` | UUID |
| `content` | `string` | Raw job description text |
| `job_keywords` | `object \| null` | Cached extracted keywords |
| `job_keywords_hash` | `string \| null` | SHA-256 of `content` at extraction time |
| `preview_hashes` | `Record<string, string>` | `prompt_id → SHA-256 hash` |

### ResumeChange (Diff Unit)

```typescript
interface ResumeChange {
  path: string;          // e.g. "workExperience[0].description[2]"
  action: "replace" | "append" | "reorder";
  original?: string;     // Current text — required for "replace"
  value: string | string[];
  reason: string;
}
```

---

## 8. Non-Functional Requirements

### Performance

| Requirement | Target |
|---|---|
| Resume upload + parse | < 15 seconds (p95) |
| Tailoring preview (full pipeline) | < 30 seconds (p95) |
| Tailoring timeout (hard limit) | 240 seconds |
| PDF export | < 10 seconds (p95) |
| Keyword extraction (cached) | < 1 second |

### Reliability

- LLM calls must use automatic transport retries: 3 retries for rate limits, 2 for timeouts, 0 for authentication errors.
- JSON parsing failures must trigger up to 2 content-quality retries with prompt correction hints.
- Refinement failures must not block the response — the pre-refinement result is returned with a warning.
- Cover letter / outreach / title generation failures must not block the confirm response — warnings are included.

### Security

- API keys must never be logged or returned in API responses. Key-like strings in error messages must be scrubbed before surfacing to the client.
- The confirm endpoint must validate the preview hash before persisting any data (prevents tampered payloads).
- Job description content must be sanitized for common LLM prompt injection patterns before being included in prompts.

### Truthfulness (AI Safety Constraint)

- The AI must never add skills, technologies, certifications, employers, or metrics not present in the original resume.
- Employment dates, degree names, and company names must never be modified.
- Every diff change targeting a specific bullet must include the exact original text so it can be verified before application.
- Fabricated content detected by the alignment validator must be automatically removed, not just flagged.

---

## 9. Technical Architecture

### System Components

```
User Browser
     │
     ▼
Next.js App (App Router)
  ├── API Routes (route handlers)
  │     ├── /api/resumes/*
  │     ├── /api/jobs/*
  │     └── /api/enrichment/*    (reserved, disabled in v2.0)
  │
  └── Service Libraries (lib/)
        ├── llm.ts               ← LLM client, retry logic, JSON extraction
        ├── parser.ts            ← PDF/DOCX → Markdown → JSON
        ├── improver.ts          ← Diff generation, application, verification
        ├── refiner.ts           ← Multi-pass refinement
        ├── cover-letter.ts      ← Cover letter, outreach, title generation
        ├── hash.ts              ← SHA-256, preview hash
        └── prompts/
              ├── templates.ts   ← All LLM prompt strings
              ├── refinement.ts  ← AI phrase blacklist
              └── enrichment.ts  ← (reserved)
```

### LLM Integration

- All LLM calls must go through `complete()` (for free-text) or `completeJson()` (for structured output). Route handlers must never call the LLM SDK directly.
- JSON mode (`response_format: { type: "json_object" }`) must be used when supported by the model; otherwise a prompt-level instruction is used.
- Thinking tags (`<think>...</think>`) produced by reasoning models must be stripped before JSON extraction.
- The LLM provider, model, and API key are configurable at runtime without a restart.

### Tailoring Pipeline (Sequence)

```
1. Load/extract job keywords
2. Generate diffs via LLM
3. Apply diffs (with whitelist + original-text verification)
4. Run diff quality checks (section counts, identity fields, word count ratio, invented metrics)
5. Safety net: preserve personal info
6. Safety net: restore dates
7. Safety net: restore dropped skills/certs
8. Safety net: protect custom sections
9. Refinement pass 1: keyword injection
10. Refinement pass 2: AI phrase removal
11. Refinement pass 3: alignment validation + auto-fix
12. Compute preview hash → store on job record
13. Return response (resume_id: null for preview)
```

---

## 10. Error Handling & Edge Cases

| Scenario | Behaviour |
|---|---|
| Uploaded file is not PDF/DOCX | HTTP 400 with file type error |
| File exceeds 4MB | HTTP 413 |
| LLM not configured or unreachable | HTTP 500; parsing status set to `"failed"` |
| LLM returns malformed JSON | Retry up to 2 times with corrective prompt hint |
| Tailoring pipeline exceeds 240s | HTTP 504 |
| Diff path not in allowed whitelist | Diff silently rejected; logged and counted |
| Diff original text doesn't match | Diff silently rejected; logged and counted |
| Confirm hash mismatch | HTTP 400: "Invalid improved resume data. Please retry preview." |
| Alignment violation detected | Critical violations auto-removed; response includes count |
| Refinement step fails | Warning appended to response; pre-refinement data returned |
| Cover letter generation fails | Warning appended; resume confirm still succeeds |
| PDF export fails | HTTP 503 |
| Resume not found | HTTP 404 |
| Retry requested on non-failed resume | HTTP 400 |
| Master resume not found during alignment | Current resume used as its own master |
| Date months lost during LLM parsing | Restored from raw Markdown via regex |

---

## 11. Out of Scope

The following features are explicitly excluded from this version:

**Resume Enrichment** — The workflow where the AI analyzes weak bullet points, generates clarifying questions (up to 6), collects user answers, and appends new bullets based on those answers. This is excluded because it requires significant UI interaction design (question/answer form, preview of added bullets) that is not yet planned, and because the tailoring pipeline already improves bullet quality.

**AI Regeneration** — The workflow where the user selects one or more sections (experience, project, skills), writes a freeform instruction, and receives a fully rewritten version of those sections. This is excluded because it overlaps heavily with the tailoring feature and introduces UX complexity around managing multiple divergent versions of a resume section.

Both features remain in the codebase as disabled endpoints and may be re-enabled in a future version.
