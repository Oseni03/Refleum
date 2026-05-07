# Refleum API

> AI-powered resume tailoring — API-first.

Refleum exposes a REST API that lets you upload resumes, tailor them to job descriptions, enrich bullet points, and generate cover letters. All operations are authenticated with an API key.

---

Every request to `/api/v1/*` (except `/api/v1/health`) must carry your API key in one of these headers:

```http
x-api-key: raik_...
# or
Authorization: Bearer raik_...
```

API keys are scoped to your **Organization**. Any resource (resume, job, etc.) created with an API key belongs to the organization associated with that key.

Manage your keys in the dashboard under **Settings > Developers**.

**Error codes**

| Code | HTTP | Meaning |
|---|---|---|
| `MISSING_KEY` | 401 | No key header present |
| `INVALID_KEY` | 401 | Key not found or revoked |
| `NOT_FOUND` | 404 | Resource does not belong to your account |
| `VALIDATION_ERROR` | 400/422 | Body failed Zod validation — `detail` lists the fields |
| `NO_PROCESSED_DATA` | 400 | Resume uploaded but not yet parsed; use `/retry-processing` |
| `NOT_TAILORED_RESUME` | 400 | Endpoint only applies to tailored (child) resumes |
| `PREVIEW_REQUIRED` | 400 | Call `/improve/preview` before `/improve/confirm` |
| `HASH_MISMATCH` | 400 | `improved_data` was modified after preview; re-run preview |
| `PERSONAL_INFO_CHANGED` | 400 | `personalInfo` must be identical to the original resume |
| `APPLY_CONFLICT` | 409 | Resume changed between /regenerate and /apply-regenerated |
| `TIMEOUT` | 504 | AI pipeline exceeded 240 s |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

All responses follow one of two shapes:

```jsonc
{ "data": { ... } }           // success
{ "error": "CODE", "detail": "..." }  // failure
```

---

## Quickstart

```bash
KEY="raik_your_key_here"

# 1. Upload your resume
RESUME=$(curl -s -X POST https://api.refleum.com/api/v1/resumes \
  -H "x-api-key: $KEY" \
  -F "file=@resume.pdf" | jq -r '.data.resume_id')

# 2. Upload a job description
JOB=$(curl -s -X POST https://api.refleum.com/api/v1/jobs \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"job_descriptions\":[\"$(cat job.txt | tr -d '\n')\"]}" \
  | jq -r '.data.job_ids[0]')

# 3. Preview tailored resume
curl -s -X POST https://api.refleum.com/api/v1/resumes/improve/preview \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"resume_id\":\"$RESUME\",\"job_id\":\"$JOB\",\"prompt_id\":\"keywords\"}" \
  | jq '.data.diff_summary'

# 4. Confirm and save
curl -s -X POST https://api.refleum.com/api/v1/resumes/improve/confirm \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"resume_id\":\"$RESUME\",\"job_id\":\"$JOB\",\"improved_data\":<paste preview.resume_preview>,\"improvements\":[]}"
```

---

## API Reference

### Resumes

#### `POST /api/v1/resumes`
Upload a PDF or DOCX resume. Parses it to structured JSON via LLM.

**Request:** `multipart/form-data`
| Field | Type | Required |
|---|---|---|
| `file` | File | ✓ PDF, DOC, DOCX — max 4 MB |

**Response `201`**
```jsonc
{ "data": { "resume_id": "clx...", "processing_status": "ready", "is_master": true, "message": "..." } }
```
If LLM parsing fails the status is `"failed"` and HTTP is `202`. Use `/retry-processing` to retry.

---

#### `GET /api/v1/resumes`
List resumes owned by the caller.

**Query params**
| Param | Default | Description |
|---|---|---|
| `include_master` | `false` | Include the master resume in results |

**Response `200`** `{ data: { resumes: ResumeSummary[] } }`

---

#### `GET /api/v1/resumes/:id`
Fetch a single resume, including processed JSON and generated content.

**Response `200`** `{ data: ResumeFetchData }`

---

#### `PATCH /api/v1/resumes/:id`
Replace a resume's structured data.
**Body:** `ResumeData` (JSON)

---

#### `DELETE /api/v1/resumes/:id`
Permanently delete a resume.

---

#### `POST /api/v1/resumes/:id/retry-processing`
Re-run LLM parsing on a `failed` or `processing` resume.

---

#### `PATCH /api/v1/resumes/:id/cover-letter`
**Body:** `{ "content": "..." }`

#### `PATCH /api/v1/resumes/:id/outreach-message`
**Body:** `{ "content": "..." }`

#### `PATCH /api/v1/resumes/:id/title`
**Body:** `{ "title": "..." }` (max 80 chars)

---

#### `POST /api/v1/resumes/:id/generate-cover-letter`
On-demand cover letter generation for an existing tailored resume.
Requires the resume to have a linked job description (i.e. created via `/improve/confirm`).

**Response `200`** `{ data: { content: "..." } }`

#### `POST /api/v1/resumes/:id/generate-outreach`
Same as above but for LinkedIn/email outreach message.

---

#### `GET /api/v1/resumes/:id/job-description`
Get the job description used to tailor a resume.

**Response `200`** `{ data: { job_id, content } }`

---

### Improve

#### `POST /api/v1/resumes/improve/preview`
Run the full AI tailoring pipeline. Returns a preview — **nothing is saved**.

**Body**
```jsonc
{
  "resume_id": "clx...",
  "job_id":    "clx...",
  "prompt_id": "keywords"   // "nudge" | "keywords" | "full"  (default: "keywords")
}
```

**Response `200`** `{ data: ImproveResumeData }` — `resume_id` is `null`.

The pipeline runs in this order:
1. Extract job keywords (cached per job)
2. Generate targeted diffs via LLM
3. Apply diffs with 4-gate verification
4. Safety nets: preserve personalInfo, restore dates, restore dropped skills, protect custom sections
5. Multi-pass refinement: keyword injection → AI phrase removal → alignment validation
6. Store preview hash in job record

---

#### `POST /api/v1/resumes/improve/confirm`
Validate the preview hash and persist the tailored resume.

**Body**
```jsonc
{
  "resume_id":     "clx...",
  "job_id":        "clx...",
  "improved_data": { /* resume_preview from /preview */ },
  "improvements":  [ /* improvements array from /preview */ ]
}
```

**Response `201`** `{ data: { resume_id, cover_letter?, outreach_message?, title?, diff_summary, warnings[] } }`

Rejects with `HASH_MISMATCH` if `improved_data` was modified after preview. Re-run `/preview` to get a fresh hash.

---

### Jobs

#### `POST /api/v1/jobs`
Upload one or more job descriptions.

**Body**
```jsonc
{
  "job_descriptions": ["Full JD text..."],
  "resume_id": "clx..."   // optional — associates JD with a specific resume
}
```

**Response `201`** `{ data: { job_ids: ["clx..."] } }`

---

#### `GET /api/v1/jobs/:id`
Fetch a job record including cached keywords.

---

### Enrichment

#### `POST /api/v1/enrichment/analyze/:resumeId`
AI identifies weak/vague bullet points and generates up to **6 clarifying questions** (hard limit).

**Response `200`**
```jsonc
{
  "data": {
    "items_to_enrich": [ { "item_id": "exp_0", "item_type": "experience", "weakness_reason": "..." } ],
    "questions": [ { "question_id": "q_0", "item_id": "exp_0", "question": "...", "placeholder": "..." } ],
    "analysis_summary": "..."
  }
}
```

---

#### `POST /api/v1/enrichment/enhance`
Generate new bullet points from user answers. **Bullets are appended — existing description is never replaced.**

**Body**
```jsonc
{
  "resume_id": "clx...",
  "answers": [
    { "question_id": "q_0", "item_id": "exp_0", "answer": "...", "question_text": "..." }
  ]
}
```

**Response `200`** `{ data: { enhancements: EnhancedDescription[] } }`

---

#### `POST /api/v1/enrichment/apply/:resumeId`
Append the enhanced bullets to the stored resume.

**Body** `{ "enhancements": EnhancedDescription[] }`

---

#### `POST /api/v1/enrichment/regenerate`
Rewrite selected sections based on a freeform instruction. Processes all items in parallel.

**Body**
```jsonc
{
  "resume_id":       "clx...",
  "items": [ { "item_id": "exp_0", "item_type": "experience", "title": "...", "current_content": ["..."] } ],
  "instruction":     "Make bullets more quantified and action-oriented",
  "output_language": "en"
}
```

**Response `200`** `{ data: { regenerated_items: RegeneratedItem[], errors: RegenerateItemError[] } }`
Non-fatal per-item errors are returned alongside successful items.

---

#### `POST /api/v1/enrichment/apply-regenerated/:resumeId`
Apply regenerated content to the stored resume.

**All-or-nothing:** every item must match the current DB content exactly (verified by comparing `original_content` to the stored description, case-insensitive). If any item fails, the entire request is rejected with `409 APPLY_CONFLICT` — no partial writes.

**Body** `RegeneratedItem[]`

---

### Settings

#### `GET /api/v1/settings/llm`
Returns the caller's LLM config. API key is masked (last 4 chars only).

#### `PUT /api/v1/settings/llm`
Update LLM provider, model, API key, and feature flags. Omit any field to leave it unchanged.

**Body** (all optional)
```jsonc
{
  "provider":             "openai",
  "model":                "gpt-4o",
  "apiKey":               "sk-...",
  "apiBase":              null,
  "reasoningEffort":      "minimal",
  "enableCoverLetter":    true,
  "enableOutreachMessage": false,
  "contentLanguage":      "en",
  "defaultPromptId":      "keywords"
}
```

Supported providers: `openai` `anthropic` `gemini` `openrouter` `deepseek` `ollama` `openai_compatible`
Supported prompt IDs: `nudge` `keywords` `full`
Supported languages: `en` `es` `zh` `ja` `pt`

---

### API Key Management

Key management endpoints use **session auth** (browser cookie), not an API key.
Integrate these into your dashboard settings page.

#### `GET /api/v1/keys`
List API keys (metadata only — key values are never retrievable after creation).

#### `POST /api/v1/keys`
Create a new API key. The `key` field in the response is returned **once only**.

**Body** `{ "name": "Production" }`

**Response `201`**
```jsonc
{ "data": { "id": "...", "name": "Production", "key": "raik_..." } }
```

#### `DELETE /api/v1/keys/:id`
Revoke an API key. Ownership is verified — you cannot revoke another user's key.

---

### Health

#### `GET /api/v1/health`
Public — no auth required.

**Response `200`** `{ "data": { "status": "ok", "db": "ok" } }`
**Response `503`** `{ "error": "INTERNAL_ERROR", "detail": "Database unreachable" }`

---

## Prompt Strategies

| `prompt_id` | Behaviour |
|---|---|
| `nudge` | Minimal edits — rephrase only where there is a clear match. No new bullets. |
| `keywords` | Weave in JD keywords where evidence already exists. May rephrase bullets. **(default)** |
| `full` | Comprehensive tailoring — may add bullets elaborating existing work. |

---

## Supported LLM Providers

| Provider | Notes |
|---|---|
| `openai` | GPT-4o, o1, o3, GPT-4 Turbo |
| `anthropic` | Claude 3.5 Sonnet, Claude 3 Opus |
| `gemini` | Gemini 1.5 Pro, Gemini 2.0 Flash |
| `openrouter` | Any model via openrouter.ai |
| `deepseek` | DeepSeek Chat, DeepSeek R1 |
| `ollama` | Local models — set `apiBase` to `http://localhost:11434` |
| `openai_compatible` | llama.cpp, vLLM, LM Studio — set `apiBase` to your endpoint |

---

## Rate Limits

Rate limits are enforced based on your organization's subscription plan:

| Plan | Rate Limit (Requests/60s) |
|---|---|
| FREE | 10 |
| STARTER | 30 |
| PRO | 100 |
| ENTERPRISE | 500 |

## Usage & Billing

Refleum uses metered billing via Polar.sh for certain AI operations. Usage is recorded in your organization's history:

- **Resume Tailoring**: 1 usage record per successful tailoring.
- **PDF Export**: 1 usage record per download.
- **Cover Letter Generation**: 1 usage record per generation (PRO+).

Track your usage at `/api/v1/usage`.