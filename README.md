# Refleum API

> API-first resume tailoring SaaS built with Next.js App Router, Prisma, Better Auth, Tailwind CSS, and AI-powered document generation.

Refleum exposes a versioned REST API under `/api/v1` for resume upload, AI tailoring, cover letter and outreach generation, and PDF export. All requests are authenticated with an organization-scoped API key.

---

## Getting Started

```bash
npm install
npx prisma generate
npm run dev
```

Create `.env.local` from `.env.example` and configure your database, Better Auth, and provider credentials.

Open the live developer docs at `http://localhost:3000/docs`.

---

## Authentication

All `/api/v1/*` requests require an organization API key.

Supported headers:

```http
x-api-key: YOUR_API_KEY
Authorization: Bearer YOUR_API_KEY
```

API keys are scoped to an organization. Resources created with a key belong to that organization.

---

## Response format

Success responses use:

```json
{ "data": { ... } }
```

Errors use:

```json
{ "error": "CODE", "detail": "..." }
```

---

## Quickstart

```bash
API_KEY="your_api_key_here"

# Upload a resume
RESUME_ID=$(curl -s -X POST http://localhost:3000/api/v1/resumes \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@resume.pdf" \
  | jq -r '.data.resume_id')

# Tailor the resume
curl -s -X POST http://localhost:3000/api/v1/resumes/${RESUME_ID}/tailor \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "We are hiring a senior backend engineer with strong API experience.",
    "strategy": "keywords"
  }'

# Download the result as PDF
curl -L http://localhost:3000/api/v1/resumes/${RESUME_ID}/pdf \
  -H "Authorization: Bearer $API_KEY" \
  -o tailored_resume.pdf
```

---

## API Reference

### Resume endpoints

- `POST /api/v1/resumes`
    - Upload a PDF or DOCX resume.
    - Request: `multipart/form-data`
    - Response: `201` with `resume_id` and processing metadata.

- `GET /api/v1/resumes`
    - List resumes for the authenticated organization.
    - Optional query: `include_master=true`

- `GET /api/v1/resumes/{id}`
    - Fetch a single resume record.

- `PATCH /api/v1/resumes/{id}`
    - Update resume metadata and structured data.

- `DELETE /api/v1/resumes/{id}`
    - Delete a resume and its linked records.

- `POST /api/v1/resumes/{id}/tailor`
    - Tailor a resume to a job description and persist the tailored result.

- `POST /api/v1/resumes/{id}/retry`
    - Retry parsing for resumes in `failed` or `processing` state.

- `GET /api/v1/resumes/{id}/pdf`
    - Export the resume as a PDF.

- `GET /api/v1/resumes/{id}/cover-letters`
    - List cover letters linked to a resume.

- `POST /api/v1/resumes/{id}/cover-letters/{clId}/regenerate`
    - Regenerate a cover letter in place.

- `GET /api/v1/resumes/{id}/outreach`
    - List outreach messages linked to a resume.

- `POST /api/v1/resumes/{id}/outreach/{oId}/regenerate`
    - Regenerate an outreach message in place.

### Settings

- `GET /api/v1/llm-config`
    - Retrieve the organization's LLM configuration.

- `PUT /api/v1/llm-config`
    - Update provider, model, API key, and feature flags.

### Health

- `GET /api/v1/health`
    - Public health check.
    - Response: `200` when the database is reachable.

---

## Error summary

| Code                          | HTTP    | Meaning                                               |
| ----------------------------- | ------- | ----------------------------------------------------- |
| `MISSING_KEY`                 | 401     | API key missing                                       |
| `INVALID_KEY`                 | 401     | API key not valid                                     |
| `UNAUTHORIZED`                | 401     | Authentication failed                                 |
| `NOT_FOUND`                   | 404     | Resource missing or belongs to another org            |
| `VALIDATION_ERROR`            | 400/422 | Input failed schema validation                        |
| `PLAN_REQUIRED`               | 403     | The endpoint requires a paid plan                     |
| `RATE_LIMITED`                | 429     | Per-minute quota exceeded                             |
| `NO_JOBS_PROVIDED`            | 400     | A required job payload was not provided               |
| `EMPTY_JOB_DESCRIPTION`       | 400     | Job description cannot be empty                       |
| `NO_MASTER_RESUME`            | 400     | Tailoring requires a master resume or valid resume ID |
| `NO_JOB_DESCRIPTION`          | 400     | Regeneration requires a linked job description        |
| `RESUME_NOT_RENDERED`         | 422     | Resume is not yet rendered for PDF export             |
| `PDF_RENDER_FAILED`           | 503     | PDF rendering failed                                  |
| `TAILORING_FAILED`            | 500     | Resume tailoring failed                               |
| `MISSING_SOURCE_TEXT`         | 400     | Resume source text is missing                         |
| `LLM_PARSING_FAILED`          | 500     | Resume parsing with the LLM failed                    |
| `RETRY_FAILED`                | 500     | Resume retry processing failed                        |
| `RESUME_NOT_PARSED`           | 400     | Resume is not parsed                                  |
| `PRIMARY_TAILORING_FAILED`    | 500     | Primary tailoring step failed                         |
| `TAILORING_PROCESS_FAILED`    | 500     | Tailoring workflow failed                             |
| `FILE_NOT_SUPPORTED`          | 415     | Uploaded file type not supported                      |
| `RESUME_NOT_FOUND`            | 404     | Resume not found                                      |
| `LLM_GENERATION_FAILED`       | 500     | LLM generation failed                                 |
| `COVER_LETTER_PROCESS_FAILED` | 500     | Cover letter generation failed                        |
| `OUTREACH_PROCESS_FAILED`     | 500     | Outreach generation failed                            |
| `REGENERATE_FAILED`           | 500     | Regeneration failed                                   |
| `PAYLOAD_TOO_LARGE`           | 413     | Payload too large                                     |
| `TIMEOUT`                     | 504     | Tailoring exceeded the hard timeout                   |
| `CONFLICT`                    | 409     | Conflict detected                                     |
| `UNPROCESSABLE`               | 422     | Unprocessable entity                                  |
| `APPLY_CONFLICT`              | 409     | Application conflict                                  |
| `INTERNAL_ERROR`              | 500     | Unexpected server error                               |

---

## Local development

- `npm run dev` — start the local app
- `npm run lint` — run ESLint
- `npm run build` — generate Prisma client and build
- `npm prisma:generate` — generate Prisma client after schema changes

## Notes

- The live API reference is available at `/docs`.
- Update `src/config/site.ts`, `README.md`, and public docs when adding new user-visible functionality.

### Settings

#### `GET /api/v1/llm-config`

Retrieve the organization's LLM configuration. The stored provider API key is masked in the response.

#### `PUT /api/v1/llm-config`

Update provider, model, API key, and feature flags. Omit any field to leave it unchanged.

**Body** (all optional)

```jsonc
{
	"provider": "openai",
	"model": "gpt-4o",
	"api_key": "sk-...",
	"api_base": null,
	"reasoning_effort": "minimal",
	"enable_cover_letter": true,
	"enable_outreach_message": false,
	"content_language": "en",
	"default_prompt_id": "keywords",
}
```

Supported providers: `openai` `anthropic` `gemini` `openrouter` `deepseek` `ollama` `openai_compatible`
Supported prompt IDs: `nudge` `keywords` `full`
Supported languages: `en` `es` `zh` `ja` `pt`

---

### API Key Management

Key management endpoints use **session auth** (browser cookie), not an API key.
Integrate these into your dashboard settings page.

#### `GET /api/keys`

List API keys (metadata only — key values are never retrievable after creation).

#### `POST /api/keys`

Create a new API key. The `key` field in the response is returned **once only**.

**Body** `{ "name": "Production" }`

**Response `201`**

```jsonc
{ "data": { "id": "...", "name": "Production", "key": "raik_..." } }
```

#### `DELETE /api/keys/:id`

Revoke an API key. Ownership is verified — you cannot revoke another user's key.

---

### Health

#### `GET /api/v1/health`

Public — no auth required.

**Response `200`** `{ "data": { "status": "ok", "db": "ok" } }`
**Response `503`** `{ "error": "INTERNAL_ERROR", "detail": "Database unreachable" }`

---

## Prompt Strategies

| `prompt_id` | Behaviour                                                                               |
| ----------- | --------------------------------------------------------------------------------------- |
| `nudge`     | Minimal edits — rephrase only where there is a clear match. No new bullets.             |
| `keywords`  | Weave in JD keywords where evidence already exists. May rephrase bullets. **(default)** |
| `full`      | Comprehensive tailoring — may add bullets elaborating existing work.                    |

---

## Supported LLM Providers

| Provider            | Notes                                                       |
| ------------------- | ----------------------------------------------------------- |
| `openai`            | GPT-4o, o1, o3, GPT-4 Turbo                                 |
| `anthropic`         | Claude 3.5 Sonnet, Claude 3 Opus                            |
| `gemini`            | Gemini 1.5 Pro, Gemini 2.0 Flash                            |
| `openrouter`        | Any model via openrouter.ai                                 |
| `deepseek`          | DeepSeek Chat, DeepSeek R1                                  |
| `ollama`            | Local models — set `apiBase` to `http://localhost:11434`    |
| `openai_compatible` | llama.cpp, vLLM, LM Studio — set `apiBase` to your endpoint |

---

## Rate Limits

Rate limits are enforced based on your organization's subscription plan:

| Plan       | Rate Limit (Requests/60s) |
| ---------- | ------------------------- |
| FREE       | 10                        |
| STARTER    | 30                        |
| PRO        | 100                       |
| ENTERPRISE | 500                       |

## Usage & Billing

Refleum uses metered billing via Polar.sh for certain AI operations. Usage is recorded in your organization's history:

- **Resume Tailoring**: 1 usage record per successful tailoring.
- **PDF Export**: 1 usage record per download.
- **Cover Letter Generation**: 1 usage record per generation (PRO+).

Track your usage at `/api/v1/usage`.
