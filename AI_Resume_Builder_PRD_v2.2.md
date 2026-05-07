# AI Resume Builder — Product Requirements Document

**Version:** 2.2
**Status:** Draft
**Last Updated:** May 2026
**Product Type:** API-first SaaS

**Tech Stack:**
Next.js 15 (App Router) · Prisma 6 · PostgreSQL (Neon) · Better Auth 1.3 ·
Polar.sh (billing) · Tailwind CSS 4 · shadcn/ui · TypeScript strict ·
Vercel (deployment) · Upstash Redis (rate limiting)

---

## ⚠️ What Changed from v2.1

| Changed Item | Reason |
|---|---|
| Multi-tenancy removed from "Out of Scope" | Now fully specified in Section 10 |
| Data models updated with `organizationId` | Row-level tenant isolation on every app table |
| Security NFRs expanded | API key auth, rate limiting, and org isolation fully specified |
| Technical architecture updated | Better Auth, Polar, and middleware layer now shown |
| New Section 10: Multi-Tenancy | Full spec: org model, API keys, billing, rate limiting, schema |
| New Section 11: Implementation Workflow | `/build-api` workflow from GEMINI.md mapped to this product |
| Error handling expanded | Added multi-tenancy error cases (401, 402, 403, 429) |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [API Consumer Personas](#2-api-consumer-personas)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Feature Scope](#4-feature-scope)
5. [Functional Requirements](#5-functional-requirements)
6. [API Endpoints](#6-api-endpoints)
7. [Data Models](#7-data-models)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Technical Architecture](#9-technical-architecture)
10. [Multi-Tenancy](#10-multi-tenancy)
11. [Implementation Workflow](#11-implementation-workflow)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [Out of Scope](#13-out-of-scope)

---

## 1. Product Overview

The AI Resume Builder is an **API-first SaaS** that enables developers to build resume
tailoring workflows into their own products. Clients integrate via REST API using
per-organization API keys. There is no bundled frontend — consumers render the data
in their own UI.

The API accepts resume files and job descriptions, and returns AI-tailored resumes,
cover letters, and outreach messages — all grounded strictly in the content of the
original resume. No fabricated skills, no invented metrics, no hallucinated employers.

### Core Capabilities

| Capability | Description |
|---|---|
| **Resume Ingestion** | Accept PDF or DOCX, convert to structured JSON via LLM parsing. One master resume per organization. |
| **Resume Tailoring** | Given a job description, produce a tailored resume using a diff-based LLM pipeline. Single request, single response, immediately persisted. |
| **Multi-Pass Refinement** | Runs automatically after every tailoring: keyword injection → AI phrase removal → alignment validation. |
| **Cover Letter Generation** | Optionally generate a cover letter alongside a tailored resume. Stored as a separate entity. Regeneratable with or without a new JD. |
| **Outreach Message Generation** | Optionally generate a LinkedIn cold outreach message. Same rules as cover letter. |
| **PDF Export** | Render any resume or cover letter to PDF via headless Chromium. |
| **CRUD Operations** | Full create/read/update/delete for resumes, cover letters, and outreach messages. |

### Design Philosophy

- **API-first:** Every capability is a REST endpoint. No UI assumptions.
- **Org-scoped:** All data belongs to an organization. No cross-tenant access is possible.
- **Truthfulness over performance:** The AI may only rephrase and reorder what already exists. It may never add skills, employers, certifications, or metrics not present in the source resume.
- **Single-step operations:** One request in, one complete response out.
- **Fail gracefully:** Refinement, cover letter, and PDF errors must never block the primary operation.

---

## 2. API Consumer Personas

This is an API product. The consumers are developers and technical teams.

### Primary: Product Developer
- Building a job search platform, ATS, or career tool
- Integrates via API key, renders results in their own UI
- Needs reliable structured output and clear error codes

### Secondary: Internal Tooling Team
- Building internal HR or recruiting tools
- Has existing resume data, wants to pipe it through the tailoring API
- Cares about data isolation between teams/clients

### Tertiary: Solo Developer / Indie Hacker
- Building a small B2C product on top of the API
- Wants minimal required fields, sensible defaults, and a free tier to prototype with

---

## 3. Goals & Success Metrics

### Product Goals

- Enable a developer to complete their first tailored resume in fewer than 3 API calls.
- Ensure every AI-generated change is grounded in the source resume.
- Produce resumes that pass ATS keyword filters without sounding AI-generated.
- Protect margins on LLM costs via per-org metered billing.

### Success Metrics

| Metric | Target |
|---|---|
| Time from `POST /tailor` to response | < 30 seconds (p95) |
| Tailoring hard timeout | 240 seconds |
| Keyword match improvement after tailoring | ≥ 20 percentage points |
| AI phrase removal rate | ≥ 90% of blacklisted phrases |
| Alignment violation false-positive rate | < 5% |
| Tailoring error rate | < 1% of requests |
| PDF export success rate | > 99% |
| API uptime | > 99.9% |
| Cross-tenant data leak incidents | 0 |

---

## 4. Feature Scope

### In Scope (v2.2)

| # | Feature | Priority |
|---|---|---|
| 1 | Organization-based multi-tenancy | P0 |
| 2 | API key authentication (per org, multiple keys) | P0 |
| 3 | Plan-gated access via Polar.sh | P0 |
| 4 | Per-org rate limiting via Upstash Redis | P0 |
| 5 | Resume upload (PDF, DOCX) with master designation | P0 |
| 6 | LLM-based resume parsing to structured JSON | P0 |
| 7 | Single-step resume tailoring with inline JD | P0 |
| 8 | Diff-based LLM pipeline | P0 |
| 9 | Multi-pass refinement | P0 |
| 10 | Resume CRUD | P0 |
| 11 | Optional cover letter generation at tailor time | P1 |
| 12 | Optional outreach message generation at tailor time | P1 |
| 13 | Cover letter CRUD + AI regeneration | P1 |
| 14 | Outreach message CRUD + AI regeneration | P1 |
| 15 | PDF export (resume + cover letter) | P1 |
| 16 | Retry failed LLM parsing | P1 |
| 17 | Org member management (invite, roles, remove) | P1 |
| 18 | API key management UI (list, create, revoke) | P1 |
| 19 | Usage metering + Polar.sh reporting | P1 |
| 20 | Re-tailoring from an existing tailored resume | P2 |
| 21 | Multi-language output (EN, ES, ZH, JA, PT) | P2 |

### Out of Scope (v2.2)

- Resume Enrichment (AI Q&A bullet enhancement)
- AI Section Regeneration
- Webhooks / async job system
- ATS score simulation
- Resume version history / git-like diffing
- A bundled frontend for end-users (API only — the dashboard for managing API keys
  and subscriptions is a separate internal tool, not a public-facing app)

---

## 5. Functional Requirements

### 5.1 Resume Upload & Parsing

**FR-001** — The API must accept multipart file uploads of PDF and DOCX format, up to 4MB.

**FR-002** — On receipt, the file must be converted to Markdown using a document parser.

**FR-003** — The Markdown must be sent to an LLM to extract a structured JSON resume
conforming to the `ResumeData` schema (see Section 7).

**FR-004** — If LLM parsing fails, the resume record must be persisted with
`status: "failed"`. The `resume_id` must still be returned so the caller can retry.

**FR-005** — The upload request must accept an optional `set_as_master` boolean field.
- `set_as_master: true` → uploaded resume becomes master; previous master demoted.
- `set_as_master: false` + no master exists → auto-designated as master.
- `set_as_master: false` + master already exists → saved as a regular resume.

**FR-006** — Master designation is scoped per organization. Each organization has at
most one master resume at any time. Promotion must atomically demote the previous master.

**FR-007** — Date fields must be preserved with month precision. If the LLM drops months,
they must be restored by cross-referencing the raw Markdown.

**FR-008** — The original Markdown must be permanently stored as `original_markdown`.
It must never be overwritten.

**FR-009** — The response must include: `resume_id`, `is_master`, `status`, `filename`.

---

### 5.2 Resume Tailoring

**FR-020** — A single `POST /api/v1/resumes/tailor` endpoint accepts the JD inline, runs the
full pipeline, and persists the result atomically. No preview step exists.

**FR-021** — Required and optional fields:
- `job_description` (string, required)
- `resume_id` (string, optional — defaults to the org's master resume)
- `strategy` (enum, optional — `nudge` | `keywords` | `full`, defaults to `nudge`)
- `generate_cover_letter` (boolean, optional — defaults to `false`)
- `generate_outreach` (boolean, optional — defaults to `false`)
- `output_language` (string, optional — defaults to server config)

**FR-022** — If `resume_id` is omitted and no master exists for the org, the request
must fail with HTTP 400.

**FR-023** — Any resume (uploaded or previously tailored) belonging to the caller's
organization may be used as the source.

**FR-024** — Tailoring strategies:
- `nudge` — Minimal edits only where there is a clear, direct match. No new bullets.
- `keywords` — Reword existing bullets to incorporate JD keywords. No new bullets.
- `full` — Comprehensive tailoring. May add new bullets elaborating on existing work.

**FR-025** — The tailored resume must be persisted immediately. The response must
include a non-null `resume_id` for the new tailored record.

**FR-026** — The tailored resume record must store: `job_description`, `job_keywords`,
`strategy`, `parent_id`, and `organization_id`.

**FR-027** — If `generate_cover_letter: true`, a `CoverLetter` record must be created,
linked to the tailored resume. `cover_letter_id` must be returned.

**FR-028** — If `generate_outreach: true`, an `Outreach` record must be created,
linked to the tailored resume. `outreach_id` must be returned.

**FR-029** — Cover letter and outreach generation must run in parallel after the
tailored resume is finalized. Failures must not block the tailor response.

**FR-030** — `refinement_stats` must be included in every tailor response.

**FR-031** — The tailoring endpoint must time out at 240 seconds and return HTTP 504.

**FR-032** — Each tailor call must be recorded as a `UsageRecord` and reported to
Polar.sh for metered billing, regardless of whether the pipeline succeeds or fails.

---

### 5.3 Tailoring Pipeline (Internal)

Steps execute in strict sequence on every tailor request.

#### Step 1 — Keyword Extraction
**FR-033** — Keywords extracted from `job_description` via LLM. Stored on the tailored
resume record as `job_keywords`.

**FR-034** — Categories: `required_skills`, `preferred_skills`, `keywords`,
`key_responsibilities`, `experience_years`, `seniority_level`.

#### Step 2 — Diff Generation
**FR-035** — LLM produces a targeted diff list (not a full resume rewrite). Each entry:
`path`, `action`, `original`, `value`, `reason`.

**FR-036** — Allowed actions: `replace`, `append`, `reorder`.

**FR-037** — Allowed path targets:
- `summary`
- `workExperience[i].description[j]`
- `workExperience[i].description` (append)
- `personalProjects[i].description[j]`
- `personalProjects[i].description` (append)
- `additional.technicalSkills` (reorder only)

#### Step 3 — Diff Application & Verification
**FR-038** — Paths targeting `personalInfo`, `education`, `customSections`, `years`,
`company`, `institution`, `degree`, `title`, `name`, or `role` must be silently rejected.

**FR-039** — `replace` actions: `original` must exactly match current text (case-insensitive).

**FR-040** — `reorder` actions: reordered list must contain exactly the same items.

**FR-041** — `append` actions: value must be a non-empty string.

**FR-042** — Rejected diffs are counted and returned in `rejected_changes`.

#### Step 4 — Safety Nets (in order)
**FR-043** — Restore `personalInfo` from source resume.

**FR-044** — Restore date month precision from structured data, then raw Markdown.

**FR-045** — Re-append any dropped skills, certifications, languages, or awards.

**FR-046** — Protect custom sections: trim LLM-added items, revert fabricated
descriptions on items that originally had `description: []`.

#### Step 5 — Multi-Pass Refinement
**FR-047** — **Pass 1 — Keyword Injection:** injectable keywords (exist in master resume)
added via LLM. Non-injectable keywords (not in master) never added.

**FR-048** — Keyword matching uses whole-word boundary matching (`\bkeyword\b`).

**FR-049** — **Pass 2 — AI Phrase Removal:** local regex pass. Blacklisted phrases
replaced with simpler alternatives. Phrases appearing in the JD are protected.

**FR-050** — Blacklist includes at minimum: `spearheaded`, `orchestrated`, `leveraged`,
`utilized`, `facilitated`, `synergy`, `cutting-edge`, `holistic`, `robust`, `impactful`,
`stakeholder`, `deliverables`, `in order to`, `moving forward`, `going forward`, em-dashes.

**FR-051** — **Pass 3 — Alignment Validation:** compare tailored resume against master.
Fabricated skills, certifications, and employers are automatically removed.

**FR-052** — Refinement failures at any pass must not block the response.

---

### 5.4 Cover Letter Generation

**FR-060** — Cover letters may only be generated at tailor time (`generate_cover_letter: true`)
or via `POST /api/v1/cover-letters/{id}/regenerate`. A JD is always required.

**FR-061** — 100–150 words, 3–4 paragraphs. Must reference a specific JD element.
Must not contain em-dashes or phrases like "excited about", "passionate about".

**FR-062** — `CoverLetter` record stores: `id`, `organization_id`, `resume_id`,
`content`, `created_at`, `updated_at`.

**FR-063** — `PATCH /api/v1/cover-letters/{id}` replaces `content` manually. No LLM call.

**FR-064** — `POST /api/v1/cover-letters/{id}/regenerate` accepts optional `job_description`.
Falls back to the linked resume's stored JD. Updates the record in place (same ID).

---

### 5.5 Outreach Message Generation

**FR-070** — Same sourcing and generation rules as cover letters. A JD is always required.

**FR-071** — 70–100 words. Must open with a specific JD reference. No generic openers.

**FR-072** — `Outreach` record stores: `id`, `organization_id`, `resume_id`,
`content`, `created_at`, `updated_at`.

**FR-073** — `PATCH /api/v1/outreach/{id}` replaces `content` manually. No LLM call.

**FR-074** — `POST /api/v1/outreach/{id}/regenerate` accepts optional `job_description`.
Falls back to linked resume's stored JD. Updates the record in place.

---

### 5.6 PDF Export

**FR-080** — `GET /api/v1/resumes/{id}/pdf` renders and returns `application/pdf`.

**FR-081** — `GET /api/v1/cover-letters/{id}/pdf` renders and returns `application/pdf`.

**FR-082** — Supported page sizes: `A4` (default) and `LETTER`.

**FR-083** — PDF failures return HTTP 503, never 500.

**FR-084** — PDF export does not modify any database records.

---

### 5.7 Resume Management

**FR-090** — `GET /api/v1/resumes` returns paginated list sorted by `updated_at` desc,
scoped to the caller's organization.

**FR-091** — Supports `?include_master=true` query parameter (default `false`).

**FR-092** — `GET /api/v1/resumes/{id}` returns full record including `structured_data`,
`job_description`, `job_keywords`, `strategy`, `parent_id`. Only accessible within org.

**FR-093** — `PATCH /api/v1/resumes/{id}` accepts partial or full `ResumeData`. No LLM call.

**FR-094** — `DELETE /api/v1/resumes/{id}` cascades to associated `CoverLetter` and
`Outreach` records.

**FR-095** — `POST /api/v1/resumes/{id}/retry` re-runs LLM parsing on stored
`original_markdown`. Only allowed when `status` is `"failed"` or `"processing"`.

---

### 5.8 Language Support

**FR-100** — All LLM-generated text must be produced in the configured output language.

**FR-101** — Supported codes: `en`, `es`, `zh`, `ja`, `pt`. Default: `en`.

**FR-102** — Language is specifiable per-request via `output_language`.

---

## 6. API Endpoints

All endpoints require a valid API key in the `Authorization: Bearer <key>` header.
All data is scoped to the organization that owns the API key.

### Resumes

| Method | Path | Plan Gate | Description |
|--------|------|-----------|-------------|
| `POST` | `/api/v1/resumes/upload` | Any | Upload PDF/DOCX, parse, designate master |
| `GET` | `/api/v1/resumes` | Any | List resumes (org-scoped) |
| `GET` | `/api/v1/resumes/{id}` | Any | Get single resume |
| `PATCH` | `/api/v1/resumes/{id}` | Any | Manually update structured data |
| `DELETE` | `/api/v1/resumes/{id}` | Any | Delete resume (cascades) |
| `POST` | `/api/v1/resumes/tailor` | Starter+ | Tailor to JD — saves immediately |
| `POST` | `/api/v1/resumes/{id}/retry` | Any | Retry failed parsing |
| `GET` | `/api/v1/resumes/{id}/pdf` | Any | Export as PDF |

### Cover Letters

| Method | Path | Plan Gate | Description |
|--------|------|-----------|-------------|
| `GET` | `/api/v1/cover-letters` | Any | List cover letters (`?resume_id=`) |
| `GET` | `/api/v1/cover-letters/{id}` | Any | Get single cover letter |
| `PATCH` | `/api/v1/cover-letters/{id}` | Any | Manually edit content |
| `DELETE` | `/api/v1/cover-letters/{id}` | Any | Delete |
| `POST` | `/api/v1/cover-letters/{id}/regenerate` | Starter+ | AI regenerate |
| `GET` | `/api/v1/cover-letters/{id}/pdf` | Any | Export as PDF |

### Outreach Messages

| Method | Path | Plan Gate | Description |
|--------|------|-----------|-------------|
| `GET` | `/api/v1/outreach` | Any | List outreach messages (`?resume_id=`) |
| `GET` | `/api/v1/outreach/{id}` | Any | Get single outreach message |
| `PATCH` | `/api/v1/outreach/{id}` | Any | Manually edit content |
| `DELETE` | `/api/v1/outreach/{id}` | Any | Delete |
| `POST` | `/api/v1/outreach/{id}/regenerate` | Starter+ | AI regenerate |

**Total: 19 endpoints**

---

## 7. Data Models

### Prisma Schema

```prisma
// schema.prisma — app-owned models only
// Better Auth owns: User, Session, Account, ApiKey (via npx auth migrate)
// Better Auth owns: Organization, Member, Invitation (via organization plugin)

model Subscription {
  id                 String    @id @default(cuid())
  organizationId     String    @unique
  polarCustomerId    String?
  polarSubscriptionId String?
  plan               Plan      @default(FREE)
  status             String    @default("active") // active, past_due, canceled
  currentPeriodEnd   DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([organizationId])
}

model UsageRecord {
  id             String   @id @default(cuid())
  organizationId String
  operation      String   // "tailor" | "parse" | "pdf_export"
  resumeId       String?
  polarRecordId  String?  // Polar usage record ID for metered billing
  createdAt      DateTime @default(now())

  @@index([organizationId])
  @@index([organizationId, createdAt])
}

model Resume {
  id               String         @id @default(cuid())
  organizationId   String                              // Tenant isolation
  isMaster         Boolean        @default(false)
  parentId         String?                             // FK → Resume (source)
  status           ResumeStatus   @default(PENDING)
  filename         String
  originalMarkdown String         @db.Text            // Immutable after creation
  structuredData   Json                               // ResumeData
  jobDescription   String?        @db.Text            // Only on tailored resumes
  jobKeywords      Json?                              // Extracted from JD
  strategy         TailorStrategy?
  title            String?                            // "Role @ Company"
  outputLanguage   String         @default("en")
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  coverLetters     CoverLetter[]
  outreach         Outreach[]
  children         Resume[]       @relation("ResumeToResume")
  parent           Resume?        @relation("ResumeToResume", fields: [parentId], references: [id])

  @@index([organizationId])
  @@index([organizationId, isMaster])
  @@index([organizationId, status])
}

model CoverLetter {
  id             String   @id @default(cuid())
  organizationId String                          // Tenant isolation (denormalized for query efficiency)
  resumeId       String
  content        String   @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  resume         Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([resumeId])
}

model Outreach {
  id             String   @id @default(cuid())
  organizationId String                          // Tenant isolation (denormalized)
  resumeId       String
  content        String   @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  resume         Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([resumeId])
}

enum ResumeStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

enum TailorStrategy {
  NUDGE
  KEYWORDS
  FULL
}

enum Plan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}
```

### TypeScript Types (`src/types/`)

```typescript
// src/types/resume.ts
export type ResumeStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED"
export type TailorStrategy = "nudge" | "keywords" | "full"

export type ResumeData = {
  personalInfo: {
    name: string; title: string; email: string; phone: string;
    location: string; website?: string; linkedin?: string; github?: string;
  }
  summary: string
  workExperience: Array<{
    id: number; title: string; company: string;
    location?: string; years: string; description: string[];
  }>
  education: Array<{
    id: number; institution: string; degree: string;
    years: string; description?: string;
  }>
  personalProjects: Array<{
    id: number; name: string; role: string; years: string;
    github?: string; website?: string; description: string[];
  }>
  additional: {
    technicalSkills: string[]; languages: string[];
    certificationsTraining: string[]; awards: string[];
  }
  customSections: Record<string, CustomSection>
}

export type JobKeywords = {
  required_skills: string[]
  preferred_skills: string[]
  keywords: string[]
  key_responsibilities: string[]
  experience_years: number | null
  seniority_level: string | null
}

export type RefinementStats = {
  passes_completed: number
  keywords_injected: number
  ai_phrases_removed: string[]
  alignment_violations_fixed: number
  initial_match_percentage: number
  final_match_percentage: number
}

// src/types/api.ts — Server Action result union types
export type TailorResumeResult =
  | {
      success: true
      resume_id: string
      resume_data: ResumeData
      title: string | null
      strategy: TailorStrategy
      refinement_stats: RefinementStats
      rejected_changes: number
      cover_letter_id: string | null
      outreach_id: string | null
      warnings: string[]
    }
  | { success: false; error: "UNAUTHORIZED" | "PLAN_REQUIRED" | "RATE_LIMITED"
                           | "RESUME_NOT_FOUND" | "NO_MASTER_RESUME" | "TIMEOUT" }

export type UploadResumeResult =
  | { success: true; resume_id: string; is_master: boolean;
      status: ResumeStatus; filename: string }
  | { success: false; error: "UNAUTHORIZED" | "FILE_TOO_LARGE"
                           | "INVALID_FILE_TYPE" | "PARSE_FAILED" }
```

### Request / Response Shapes

```typescript
// POST /api/v1/resumes/upload (multipart/form-data)
type UploadRequest = { file: File; set_as_master?: boolean }
// → 201 UploadResumeResult (success branch)

// POST /api/v1/resumes/tailor
type TailorRequest = {
  job_description: string
  resume_id?: string
  strategy?: TailorStrategy        // default: "nudge"
  generate_cover_letter?: boolean  // default: false
  generate_outreach?: boolean      // default: false
  output_language?: string         // default: "en"
}
// → 201 TailorResumeResult (success branch)

// POST /api/v1/cover-letters/{id}/regenerate
type RegenerateRequest = { job_description?: string }
// → 200 { cover_letter_id: string; content: string; updated_at: string }

// POST /api/v1/outreach/{id}/regenerate
type RegenerateOutreachRequest = { job_description?: string }
// → 200 { outreach_id: string; content: string; updated_at: string }

// PATCH /api/v1/resumes/{id}
type UpdateResumeRequest = Partial<ResumeData>
// → 200 { resume_id: string; structured_data: ResumeData; updated_at: string }

// PATCH /api/cover-letters/{id}
type UpdateCoverLetterRequest = { content: string }
// → 200 { cover_letter_id: string; content: string; updated_at: string }
```

---

## 8. Non-Functional Requirements

### Performance

| Operation | Target (p95) |
|---|---|
| `POST /api/v1/resumes/upload` (parse) | < 15 seconds |
| `POST /api/v1/resumes/tailor` (full pipeline) | < 30 seconds |
| `POST /api/v1/resumes/tailor` hard timeout | 240 seconds |
| `GET /api/v1/resumes/{id}/pdf` | < 10 seconds |
| `POST /api/v1/cover-letters/{id}/regenerate` | < 10 seconds |
| All read endpoints (`GET`) | < 500ms |
| API key verification (middleware) | < 50ms |

### Reliability

- LLM transport errors: 3 retries for rate limits, 2 for timeouts, 0 for auth errors.
- Malformed JSON from LLM: up to 2 content-quality retries with corrective prompt hints.
- Refinement, cover letter, and outreach failures must not fail the primary operation.
- Usage records must be written even when the tailoring pipeline fails, to ensure
  accurate billing. Failures to write usage records must be logged but must not
  surface as API errors.

### Security

- All endpoints must require a valid organization API key in `Authorization: Bearer <key>`.
- API keys are verified server-side via Better Auth's `auth.api.verifyApiKey()`, wrapped
  in `requireApiKey()` from `src/lib/middleware.ts`. No inline key verification.
- `enableSessionForAPIKeys` is permanently disabled. A leaked key must never impersonate
  a session.
- The `organizationId` is always derived from the verified API key's `referenceId`.
  It must never be accepted from the request body or query parameters.
- Every database query for app data must include `WHERE organizationId = ctx.organizationId`.
  Missing this clause on any query is a critical security bug.
- API keys must be hashed (SHA-256) before storage. Raw keys are shown only once at
  creation (one-time reveal) and never stored or logged.
- LLM API keys (provider credentials) must never appear in logs, responses, or error
  messages. Key-like strings in upstream error messages must be scrubbed.
- Job description text must be sanitized for LLM prompt injection patterns before
  inclusion in any prompt.
- File uploads: MIME type and size validated before processing. Content never executed.

### Data Integrity

- `originalMarkdown` is immutable after creation.
- `personalInfo` of a tailored resume always matches the source resume's `personalInfo`.
- Cascading deletes: `Resume` delete cascades to `CoverLetter` and `Outreach`.
- Fabricated content detected by alignment validator is auto-removed before response.
- Master promotion is atomic: a transaction must demote the old master and promote the
  new one. Partial state (two masters) must never occur.

### Truthfulness Constraint

- The LLM may only rephrase, reorder, or expand on content in the source resume.
- The LLM may never add skills, employers, certifications, dates, or metrics not present
  in the source resume.
- Every `replace` diff must include the exact `original` text for pre-application verification.
- Fabricated content surviving to alignment validation is automatically removed.

---

## 9. Technical Architecture

### Component Overview

```
API Client (Developer's App)
        │ Authorization: Bearer <api_key>
        ▼ REST over HTTPS
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 — App Router (Vercel)                       │
│                                                         │
│  middleware.ts (root)                                   │
│    └── Intercepts all /api/v1/* routes                     │
│                                                         │
│  src/lib/middleware.ts (auth/authz helpers)             │
│    ├── requireApiKey(req)   → organizationId, plan      │
│    ├── requirePlan(orgId, "STARTER")                    │
│    └── requireRateLimit(orgId, plan)                    │
│                                                         │
│  Route Handlers (app/api/v1/)                              │
│    ├── resumes/upload/route.ts                          │
│    ├── resumes/tailor/route.ts                          │
│    ├── resumes/[id]/route.ts                            │
│    ├── resumes/[id]/pdf/route.ts                        │
│    ├── resumes/[id]/retry/route.ts                      │
│    ├── cover-letters/route.ts                           │
│    ├── cover-letters/[id]/route.ts                      │
│    ├── cover-letters/[id]/regenerate/route.ts           │
│    ├── cover-letters/[id]/pdf/route.ts                  │
│    ├── outreach/route.ts                                │
│    ├── outreach/[id]/route.ts                           │
│    └── outreach/[id]/regenerate/route.ts                │
│                                                         │
│  Server Layer (src/server/)                             │
│    ├── resumes.ts        — query fns + Server Actions   │
│    ├── cover-letters.ts                                 │
│    ├── outreach.ts                                      │
│    ├── subscription.ts   — plan checks + usage metering │
│    └── organizations.ts  — org management               │
│                                                         │
│  Service Layer (src/lib/)                               │
│    ├── llm.ts            — LLM client + retry logic     │
│    ├── parser.ts         — PDF/DOCX → Markdown → JSON   │
│    ├── improver.ts       — Diff generation + application│
│    ├── refiner.ts        — Multi-pass refinement        │
│    ├── cover-letter.ts   — CL + outreach generation     │
│    └── prompts/          — All LLM prompt strings       │
└─────────────────────────────────────────────────────────┘
        │                         │                │
        ▼                         ▼                ▼
Neon PostgreSQL             Better Auth         Upstash Redis
(via Prisma Accelerate)     (auth.ts)           (rate limiting)
        │                         │
        ▼                         ▼
  App data tables           apiKey table
  (organizationId on all)   (npx auth migrate)
                                  │
                                  ▼
                            Polar.sh webhooks
                            (subscription sync)
```

### Request Authentication Flow

```
Incoming request
        │
        ▼
middleware.ts (root) — intercepts /api/v1/* routes
        │
        ▼
src/lib/middleware.ts — requireApiKey(req)
  1. Extract key from Authorization header
  2. auth.api.verifyApiKey({ key }) → Better Auth lookup
  3. Reject if missing, invalid, or revoked → 401
        │
        ▼
  4. Load organizationId from key.referenceId
  5. Load plan from Subscription table via organizationId
  6. Attach { organizationId, plan } to request context
        │
        ▼
requirePlan(orgId, requiredPlan) — check plan gate
  └── Returns { allowed: false, error: "PLAN_REQUIRED" } → 402
        │
        ▼
requireRateLimit(orgId, plan) — Upstash Redis sliding window
  └── Returns { limited: true } → 429 with Retry-After header
        │
        ▼
Route handler executes
  └── All DB queries: WHERE organizationId = ctx.organizationId
        │
        ▼
After tailor call:
  └── Write UsageRecord to DB
  └── POST usage to Polar.sh metered billing
```

### Tailoring Pipeline (Execution Order)

```
POST /api/v1/resumes/tailor
        │
        ▼
1.  requireApiKey → organizationId
2.  requirePlan(orgId, "STARTER")
3.  requireRateLimit(orgId, plan)
4.  Validate request body (Zod)
5.  Load source resume — must belong to organizationId
6.  Extract keywords from job_description via LLM
7.  Generate diff list via LLM (strategy-specific prompt)
8.  Apply diffs (path allowlist + original-text verification)
9.  Count and log rejected diffs
10. Safety net: restore personalInfo from source
11. Safety net: restore date month precision
12. Safety net: re-append dropped skills/certs/languages/awards
13. Safety net: protect custom sections
14. Refinement Pass 1: keyword injection (LLM)
15. Refinement Pass 2: AI phrase removal (local regex)
16. Refinement Pass 3: alignment validation + auto-fix (local)
17. Persist tailored Resume record (with organizationId)
18. [Parallel] Generate cover letter if requested
19. [Parallel] Generate outreach if requested
20. [Parallel] Generate title from JD
21. Persist CoverLetter + Outreach records (with organizationId)
22. Write UsageRecord
23. Report usage to Polar.sh
        │
        ▼
Return 201
```

---

## 10. Multi-Tenancy

### Overview

The product uses **organization-based multi-tenancy** with **row-level data isolation**.
Every piece of application data belongs to exactly one organization. Organizations are
managed by Better Auth's organization plugin. API keys are managed by Better Auth's
`@better-auth/api-key` plugin.

---

### 10.1 Tenant Model

**A tenant is an Organization.** Every API consumer (whether a solo developer or a
company) operates as an organization. Members of that organization share the same data
pool (resumes, cover letters, outreach messages).

```
Organization
  ├── organizationId (Better Auth managed)
  ├── name
  ├── slug
  └── Members[]
        ├── role: "owner" | "admin" | "member"
        └── userId → User

Subscription (Prisma — app-owned)
  └── organizationId (1:1 with Organization)
      ├── plan: FREE | STARTER | PRO | ENTERPRISE
      ├── status: active | past_due | canceled
      └── polarSubscriptionId
```

**Roles:**

| Role | Permissions |
|------|-------------|
| `owner` | All permissions. Can delete org, manage billing, manage all members and keys. |
| `admin` | Create/revoke API keys. Invite/remove members. Cannot delete org or change billing. |
| `member` | Use the API. Cannot manage keys, members, or billing. |

Roles are enforced by Better Auth's organization plugin. The API itself is key-authenticated
(not session-authenticated), so role enforcement applies to the management dashboard only.

---

### 10.2 API Key Management

**Implementation:** Better Auth `@better-auth/api-key` plugin.

**Key rules (non-negotiable — from AGENTS.md and GEMINI.md):**
- `enableSessionForAPIKeys` is **permanently disabled**. A leaked key must never impersonate a session.
- The `apiKey` table is **owned by Better Auth** — managed via `npx auth migrate`.
  It must **never** be added to `schema.prisma`.
- `referenceId` on each key is set to the `organizationId` it belongs to.
- Keys are verified server-side only, via `requireApiKey()` in `src/lib/middleware.ts`,
  which wraps `auth.api.verifyApiKey()`. No route handler calls `verifyApiKey()` directly.
- Raw keys are shown exactly **once** at creation (one-time reveal dialog that blocks
  close until the key is copied). They are never stored or re-shown.
- Keys are hashed before storage. Better Auth handles this internally.

**API key lifecycle:**

```
Owner/Admin creates key via dashboard
        │
        ▼
authClient.apiKey.create({ name: "Production", referenceId: orgId })
        │
        ▼
One-time reveal dialog shows raw key
User copies key — dialog cannot be closed until copied
        │
        ▼
Key stored (hashed) in apiKey table (Better Auth)
linked to organizationId via referenceId
        │
        ▼
Developer uses key in Authorization: Bearer <key> header
        │
        ▼
requireApiKey() in middleware verifies → extracts organizationId
        │
        ▼
Key revoked via dashboard when no longer needed
(Revocation is immediate — next request returns 401)
```

**Key properties:**
- Multiple keys per organization (e.g. "Production", "Staging", "CI")
- Each key has: `name`, `referenceId` (orgId), `createdAt`, `lastUsedAt`, `revokedAt`
- Listing keys returns metadata only — never the raw key value after creation

---

### 10.3 Data Isolation

**Strategy:** Row-level isolation with `organizationId` on every application table.

**Tables with `organizationId`:**

| Table | Column | Indexed |
|-------|--------|---------|
| `resumes` | `organizationId` | ✅ |
| `cover_letters` | `organizationId` | ✅ |
| `outreach` | `organizationId` | ✅ |
| `usage_records` | `organizationId` | ✅ |
| `subscriptions` | `organizationId` | ✅ (unique) |

**Enforcement rules:**
1. `organizationId` is **always derived from the verified API key** (`key.referenceId`).
   It is **never** accepted from the request body, query params, or headers.
2. Every Prisma query that reads or writes application data must include
   `{ where: { organizationId: ctx.organizationId } }`.
3. A missing `organizationId` filter on any query is a **critical security bug**.
4. Record ownership is verified before any update or delete:
   load the record first, confirm `record.organizationId === ctx.organizationId`,
   then proceed. Never use `updateMany` without the org filter.
5. `organizationId` is **denormalized** onto `CoverLetter` and `Outreach` records
   (in addition to the FK to `Resume`) to allow efficient direct queries without a join.

**Query pattern (enforced in `src/server/resumes.ts`):**

```typescript
// ✅ Correct — always include organizationId
const resume = await prisma.resume.findFirst({
  where: { id: resumeId, organizationId: ctx.organizationId }
})
if (!resume) throw new NotFoundError()

// ❌ Wrong — missing org filter, potential cross-tenant access
const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
```

---

### 10.4 Billing (Polar.sh)

**Implementation:** Polar.sh as Merchant of Record. Subscriptions synced via Polar webhooks.

**Plans:**

| Plan | Monthly Price | Tailor Calls Included | Overage per Call | Rate Limit |
|------|---------------|----------------------|------------------|------------|
| Free | $0 | 10 / month | Not available | 1 call/min |
| Starter | $29 | 200 / month | $0.15 | 20 calls/min |
| Pro | $99 | 1,000 / month | $0.10 | 60 calls/min |
| Enterprise | Custom | Unlimited (contracted) | Volume pricing | Custom |

**Billing rules:**
- Tailor calls are the only metered operation. PDF exports and read operations are included
  in all plans.
- Each tailor call — whether it succeeds or fails — consumes one unit of the monthly
  allowance. This is because every call triggers LLM API costs regardless of outcome.
- The `Subscription` Prisma model is the single source of truth for plan status.
  It is synced from Polar via webhook on every subscription event.
- `requirePlan()` in `src/lib/middleware.ts` reads from the `Subscription` table.
  It never calls Polar's API directly at request time (to avoid latency).
- Checkout and billing portal sessions are created via Server Actions in
  `src/server/subscription.ts`, not via API route handlers.
- Webhook handlers live at `app/api/subscription/route.ts`. All events are verified
  by Polar's webhook signature before processing. Handlers are idempotent.
- Usage is reported to Polar's metered billing API via `UsageRecord` writes in
  `src/server/subscription.ts`.

**Subscription sync flow:**

```
Polar event: subscription.created / subscription.updated / subscription.deleted
        │
        ▼
app/api/subscription/route.ts
  └── Verify Polar webhook signature
  └── Check idempotency (event already processed?)
        │
        ▼
  └── Upsert Subscription record in Prisma
      { organizationId, plan, status, polarSubscriptionId, currentPeriodEnd }
```

---

### 10.5 Rate Limiting

**Implementation:** Upstash Redis, sliding window algorithm.

**Rules:**
- Rate limits are enforced per organization (not per API key or per IP).
- Limits are defined by plan tier (see table in 10.4).
- `requireRateLimit(orgId, plan)` in `src/lib/middleware.ts` checks and increments
  the sliding window counter in Upstash.
- Rate limited requests return HTTP 429 with:
  ```
  Retry-After: <seconds until reset>
  X-RateLimit-Limit: <plan limit per minute>
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: <unix timestamp>
  ```
- All non-429 responses must include the rate limit headers so clients can monitor usage.
- Free tier is additionally limited to 10 tailor calls per calendar month. This is
  enforced by counting `UsageRecord` rows for the current month in the `requirePlan()`
  check, not in the per-minute rate limiter.

---

### 10.6 Organization Member Management

Better Auth's organization plugin handles the full membership lifecycle. The following
operations are exposed through the dashboard (session-authenticated, not API-key-authenticated):

- **Invite member** — sends email via Resend; creates a pending invitation
- **Accept/reject invitation** — via `app/api/accept-invitation/` and
  `app/api/reject-invitation/` (existing routes)
- **Change member role** — owner can promote/demote admin/member
- **Remove member** — owner and admin can remove members
- **Leave organization** — any member except the sole owner

These are **not exposed as API key-authenticated endpoints**. They are session-only
operations for the management dashboard.

---

### 10.7 Prisma Schema Boundaries

Understanding what owns what is critical for avoiding migration conflicts:

| Table | Owner | Migration Tool |
|-------|-------|----------------|
| `user` | Better Auth | `npx auth migrate` |
| `session` | Better Auth | `npx auth migrate` |
| `account` | Better Auth | `npx auth migrate` |
| `api_key` | Better Auth (apiKey plugin) | `npx auth migrate` |
| `organization` | Better Auth (org plugin) | `npx auth migrate` |
| `member` | Better Auth (org plugin) | `npx auth migrate` |
| `invitation` | Better Auth (org plugin) | `npx auth migrate` |
| `resumes` | App | `prisma migrate dev` |
| `cover_letters` | App | `prisma migrate dev` |
| `outreach` | App | `prisma migrate dev` |
| `subscriptions` | App | `prisma migrate dev` |
| `usage_records` | App | `prisma migrate dev` |

**Rule:** Never add Better Auth-owned tables to `schema.prisma`. Never run `npx auth migrate`
to manage app tables. These are separate migration namespaces.

---

## 11. Implementation Workflow

This product uses the **`/build-api` workflow** defined in `GEMINI.md`. Every feature
must follow this sequence without skipping or reordering steps.

### `/build-api` Step Mapping for This Product

| Step | What Happens | Files Touched |
|------|-------------|---------------|
| **1. Spec** | Parse PRD section → structured plan. **Wait for approval before writing code.** | None |
| **2. Schema** | DB Agent: add `Resume`, `CoverLetter`, `Outreach`, `Subscription`, `UsageRecord` to `schema.prisma`. Run `npm db:migrate` then `npm db:generate`. Run `npx auth migrate` separately for Better Auth tables. | `prisma/schema.prisma`, `prisma/migrations/` |
| **3. Server Layer** | Server Agent: query functions and Server Actions in `src/server/resumes.ts`, `src/server/cover-letters.ts`, `src/server/outreach.ts`, `src/server/subscription.ts`. All DB access here — no Prisma calls in route handlers. | `src/server/*.ts` |
| **4. API Key Plugin** | Server Agent: install `@better-auth/api-key`, add plugin to `src/lib/auth.ts`, add to `src/lib/auth-client.ts`. Run `npx auth migrate`. **No other structural changes to `auth.ts` in this step.** | `src/lib/auth.ts`, `src/lib/auth-client.ts` |
| **5. Auth & Billing Middleware** | Add `requireApiKey()`, `requirePlan()`, `requireRateLimit()` to `src/lib/middleware.ts`. Import Upstash Redis client. Wire Polar plan check to Subscription table. | `src/lib/middleware.ts` |
| **6. Route Handlers** | All 19 route handlers in `src/app/api/`. Each handler: (a) calls middleware helpers, (b) calls server layer functions, (c) returns `{ data }` or `{ error }`. Zod validation on every request body. No inline auth. No direct Prisma calls. | `src/app/api/**/*.ts` |
| **7. API Key Management UI** | UI Agent: API key list page, create dialog (one-time reveal — blocks close until copied), revoke action. Session-authenticated. Lives in `app/(authenticated)/dashboard/api-keys/`. | `src/app/(authenticated)/dashboard/api-keys/`, `src/components/settings/` |
| **8. Types** | Types Agent: domain files in `src/types/resume.ts`, `src/types/cover-letter.ts`, `src/types/outreach.ts`, `src/types/api.ts`. Re-export all from `src/types/index.ts`. **Types step runs after server layer, before UI.** | `src/types/*.ts` |
| **9. Docs** | Docs Agent: update `src/config/site.ts`, `README.md`, `/about`, `/privacy` (new data: resume files, job descriptions stored), `/terms` (plan limits, metered billing). | `src/config/site.ts`, `README.md`, `src/app/(public)/**` |
| **10. Verification** | Run checklist below. | — |

### Verification Checklist

Before marking any feature complete:

```
Auth & Isolation
[ ] Every route handler calls requireApiKey() before any data access
[ ] organizationId is always from ctx, never from request body
[ ] Every Prisma query includes WHERE organizationId = ctx.organizationId
[ ] No inline auth logic in any route handler or Server Action

API Keys
[ ] enableSessionForAPIKeys is NOT set in auth.ts
[ ] api_key table is NOT in schema.prisma
[ ] Raw key is shown only once (one-time reveal dialog)
[ ] requireApiKey() is the only call site for verifyApiKey()

Billing & Rate Limiting
[ ] Every tailor call writes a UsageRecord
[ ] requirePlan() reads from Subscription table, not Polar API
[ ] Webhook handler verifies Polar signature before processing
[ ] 429 response includes Retry-After and X-RateLimit-* headers

Types
[ ] All shared types live in src/types/ — none defined inline in src/server/
[ ] Server Action return types use discriminated unions with literal error codes
[ ] Client Components import from @/types, not from @/server

Docs
[ ] siteConfig and README.md updated
[ ] /privacy updated (resume files, JD text, usage records stored)
[ ] /terms updated (plan limits, metered billing, overage rules)
```

### Agent Ownership (from GEMINI.md)

| Agent | Owns in This Product |
|-------|---------------------|
| **DB Agent** | `schema.prisma`, `migrations/` — Resume, CoverLetter, Outreach, Subscription, UsageRecord models |
| **Server Agent** | `src/server/resumes.ts`, `src/server/cover-letters.ts`, `src/server/outreach.ts`, `src/server/subscription.ts`, `src/app/api/**` |
| **Types Agent** | `src/types/resume.ts`, `src/types/cover-letter.ts`, `src/types/outreach.ts`, `src/types/api.ts`, `src/types/index.ts` |
| **Auth Agent** | `src/lib/auth.ts` (apiKey plugin only), `src/lib/auth-client.ts`, `src/lib/middleware.ts` |
| **Billing Agent** | `src/lib/polar.ts`, `src/server/subscription.ts`, `src/app/api/subscription/` |
| **UI Agent** | `src/app/(authenticated)/dashboard/api-keys/`, `src/components/settings/` |
| **Docs Agent** | `README.md`, `src/config/site.ts`, `src/app/(public)/about/`, `/privacy/`, `/terms/` |

---

## 12. Error Handling & Edge Cases

### Standard Error Response Shape

```typescript
// All errors follow this shape
{ error: string; code: string; details?: string }

// Examples
{ error: "Unauthorized", code: "MISSING_KEY" }
{ error: "Plan required", code: "PLAN_REQUIRED", details: "This endpoint requires a Starter plan or above." }
{ error: "Rate limit exceeded", code: "RATE_LIMITED", details: "Retry after 42 seconds." }
```

### Error Table

| Scenario | HTTP | Code | Notes |
|---|---|---|---|
| Missing Authorization header | 401 | `MISSING_KEY` | |
| Invalid or revoked API key | 401 | `INVALID_KEY` | |
| Plan does not meet requirement | 402 | `PLAN_REQUIRED` | Includes upgrade URL |
| Rate limit exceeded | 429 | `RATE_LIMITED` | Includes `Retry-After` header |
| Monthly tailor limit reached (Free) | 429 | `MONTHLY_LIMIT_REACHED` | |
| File is not PDF or DOCX | 400 | `INVALID_FILE_TYPE` | |
| File exceeds 4MB | 413 | `FILE_TOO_LARGE` | |
| Empty file | 400 | `EMPTY_FILE` | |
| LLM not configured | 500 | `LLM_NOT_CONFIGURED` | Resume saved as `FAILED` |
| LLM returns malformed JSON | 500 | `LLM_PARSE_ERROR` | After 2 retries |
| `POST /tailor` — no master + no resume_id | 400 | `NO_MASTER_RESUME` | |
| `POST /tailor` — resume_id not found | 404 | `RESUME_NOT_FOUND` | |
| `POST /tailor` — resume belongs to different org | 404 | `RESUME_NOT_FOUND` | Never expose org mismatch |
| Tailoring pipeline exceeds 240s | 504 | `TIMEOUT` | |
| Diff path not in allowlist | Internal | — | Silently rejected, counted in `rejected_changes` |
| Diff original text mismatch | Internal | — | Silently rejected, counted |
| All diffs rejected | 201 | — | Resume saved unchanged. Warning in response. |
| Refinement pass fails | 201 | — | Pre-refinement result saved. Warning in response. |
| Cover letter generation fails | 201 | — | `cover_letter_id: null`. Warning in response. |
| Outreach generation fails | 201 | — | `outreach_id: null`. Warning in response. |
| PDF render fails | 503 | `PDF_RENDER_FAILED` | |
| Retry on non-failed resume | 400 | `INVALID_STATUS` | |
| Regenerate — no JD on linked resume | 400 | `NO_JOB_DESCRIPTION` | |
| `DELETE` resume with children | 200 | — | Cascades to CoverLetter + Outreach |
| Alignment violation (critical) | Internal | — | Auto-removed before response |
| Master promotion — no previous master | Internal | — | No demotion needed |
| Usage record write fails | Internal | — | Logged, never surfaces as API error |
| Polar usage report fails | Internal | — | Logged, retried async, never surfaces as API error |
| Two concurrent master promotions | Internal | — | Atomic transaction prevents dual-master state |

---

## 13. Out of Scope

### Explicitly Excluded from v2.2

**Resume Enrichment** — AI question-and-answer flow for bullet enhancement. Requires
stateful multi-step interaction unsuitable for a single-request API.

**AI Section Regeneration** — Freeform feedback to rewrite selected resume sections.
Overlaps with tailoring and creates version management ambiguity.

**Webhooks / Async Job System** — All endpoints are synchronous. Long-running operations
(parse, tailor) block until complete. An async job system is a future concern.

**ATS Score Simulation** — Out of scope.

**Resume Version History** — Out of scope.

**End-User Facing Frontend** — This is an API product. No public-facing UI for end users.
The management dashboard (API key management, billing, org settings) is an internal
tool for API consumers — not part of the product surface delivered to their users.

**Per-Key Role Scoping** — API keys have no scopes (read-only, write-only, etc.) in v2.2.
All keys belonging to an org have the same access level within that org. Scoped keys
are a future enhancement.

**Database-Per-Tenant Isolation** — Row-level isolation is used for all plans.
Physical isolation (separate database per tenant) is not offered in v2.2. This can be
revisited if enterprise customers contractually require it.

**Self-Hosted / On-Premise Deployment** — Not supported. Deployment is Vercel + Neon only.
