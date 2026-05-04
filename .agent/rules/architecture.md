# Architecture Rule

These are the structural decisions for this project. They are final. Do not invent alternative
patterns, restructure directories, or introduce new layers without explicit instruction.
When in doubt, follow the existing pattern in the codebase.

---

## 1. Technology Stack

| Concern             | Technology                        |
|---------------------|-----------------------------------|
| Framework           | Next.js 15 (App Router)           |
| Language            | TypeScript (strict mode)          |
| Database            | PostgreSQL via Prisma ORM         |
| Auth                | Custom session-based auth         |
| Billing             | Polar.sh                          |
| AI                  | Vercel AI SDK (model-agnostic)    |
| Email               | Resend + React Email              |
| Deployment          | Vercel                            |
| Styling             | Tailwind CSS                      |

Never add a dependency for something already covered by this stack.
Before adding any new package, check if the existing stack can solve the problem.

---

## 2. Directory Structure

```
/app
  /(auth)/           → Login, signup, password reset pages (public)
  /(dashboard)/      → Protected app pages (require session)
    /[feature]/
      page.tsx       → Server Component — fetches data, passes to client components
      _components/   → Client components scoped to this feature
  /api/
    /auth/           → Internal auth endpoints
    /ai/             → AI inference endpoints (rate-limited, session-required)
    /webhooks/
      /polar/        → Polar.sh webhook handler
    /v1/             → Public API (API key auth)

/lib
  /auth/             → Session logic, getSession(), middleware helpers
  /db/
    index.ts         → Prisma client singleton
  /services/         → Business logic, one file per domain
  /ai/
    /prompts/        → System prompt templates, one file per AI feature
    index.ts         → Vercel AI SDK wrappers
  /email/            → Resend send functions, one per email type
  /billing/
    /handlers/       → One file per Polar webhook event type
    index.ts         → Polar client singleton
  /api-keys/         → API key hashing, validation, creation
  /rate-limit/       → Rate limiting helpers
  /types/            → Shared TypeScript types and interfaces
  /utils/            → Pure utility functions (no side effects, no DB access)
  features.ts        → Plan-to-feature mapping (free | pro | team)

/emails              → React Email templates, one component per email

/prisma
  schema.prisma      → Prisma schema (single source of truth for DB shape)
  /migrations/       → Prisma migration files (generated, never hand-edited)

/middleware.ts       → Next.js middleware (session refresh, protected route enforcement)
```

---

## 3. Layer Responsibilities

### Route Handlers (`/app/api/`)
Responsible for:
- Authenticating the request (session or API key)
- Validating input with Zod
- Calling the service layer
- Returning the HTTP response

NOT responsible for:
- Database queries (delegate to service)
- Business logic (delegate to service)
- Sending emails (delegate to service → email lib)

### Service Layer (`/lib/services/`)
Responsible for:
- All business logic
- Orchestrating DB queries via Prisma
- Calling other services (email, AI, billing)
- Returning typed `Result<T, E>` objects

NOT responsible for:
- HTTP concerns (status codes, headers)
- Input validation (done at route level)
- Direct Resend/Polar/AI SDK calls — use `/lib/email/`, `/lib/billing/`, `/lib/ai/`

### Database Layer (`/lib/db/` + `/prisma/`)
Responsible for:
- `prisma/schema.prisma` — single source of truth for all models and relations
- `/lib/db/index.ts` — the Prisma client singleton
- `prisma/migrations/` — generated migration files

NOT responsible for:
- Query logic (that lives in services)
- Business rules

---

## 4. Data Flow Pattern

```
Request
  → middleware.ts          (session refresh)
  → route handler          (auth check → zod validation)
  → service layer          (business logic → DB queries)
  → response
```

Never skip layers. A route handler must not query the DB directly.
A service must not parse HTTP requests.

---

## 5. TypeScript Rules

- `strict: true` is mandatory in `tsconfig.json` — never disable it.
- No `any` types. Use `unknown` and narrow with type guards when type is genuinely unknown.
- No non-null assertions (`!`) except where a value's presence is guaranteed by a prior check in the same scope.
- Shared types live in `/lib/types/` — never redefine a type that already exists there.
- Zod schemas are the source of truth for external data shapes. Infer TypeScript types from Zod schemas using `z.infer<>` — never define both separately.

```ts
// ✅ Correct — infer from Zod
const CreateProjectSchema = z.object({ name: z.string().min(1).max(100) });
type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ❌ Never do this — type and schema drift
type CreateProjectInput = { name: string };
const CreateProjectSchema = z.object({ name: z.string() });
```

---

## 6. Result Type Pattern

All service functions return a typed `Result<T, E>` — never throw across layer boundaries.

```ts
// /lib/types/result.ts
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

// ✅ Service usage
export async function createProject(input: CreateProjectInput): Promise<Result<Project>> {
  try {
    const project = await prisma.project.create({ data: input });
    return { success: true, data: project };
  } catch (err) {
    console.error("[projectService.create]", err);
    return { success: false, error: { code: "DB_ERROR", message: "Failed to create project" } };
  }
}

// ✅ Route handler usage
const result = await projectService.create(parsed.data);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 500 });
}
return NextResponse.json({ data: result.data });
```

---

## 7. Server vs Client Components

- Default to Server Components — do not add `"use client"` unless the component needs interactivity or browser APIs.
- Server Components fetch data directly; they do not use `useEffect` + `fetch`.
- Client components live in `_components/` subdirectories, scoped to their feature.
- Never fetch data in a client component that could be fetched in its Server Component parent.
- Pass data down as props from Server to Client — keep client components as leaves.

---

## 8. Environment & Configuration

- All environment variables are typed and validated at startup in `/lib/env.ts` using Zod.
- If a required env var is missing, the app throws at boot — it does not fail silently at runtime.
- Never access `process.env` directly in components or services — always go through `/lib/env.ts`.

```ts
// /lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  POLAR_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

---

## 9. API Response Shape

All API routes return consistent JSON shapes. Never deviate from these:

```ts
// Success
{ "data": <payload>, "error": null }

// Error
{ "data": null, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

Public API (`/v1/`) additionally wraps lists in:
```ts
{ "data": { "items": [...], "total": number, "page": number }, "error": null }
```

---

## 10. Feature Flag & Plan Enforcement

- All plan-gated features are defined in `/lib/features.ts` as a map of `feature → minimum plan`.
- Use the `requirePlan(feature)` helper in route handlers before executing plan-gated logic.
- Never hardcode plan checks inline in business logic — always go through `features.ts`.

```ts
// /lib/features.ts
export const FEATURE_PLANS = {
  "ai:generate": "pro",
  "api:public-access": "pro",
  "export:csv": "team",
} as const;

// Route handler usage
const planCheck = await requirePlan(session, "ai:generate");
if (!planCheck.allowed) {
  return NextResponse.json({ error: { code: "PLAN_REQUIRED", message: "Upgrade to Pro" } }, { status: 403 });
}
```
