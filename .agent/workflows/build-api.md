---
description: >Scaffold a complete API-first saas app
---

---
description: >
  Scaffold a complete API-first feature: PRD/description → schema → server layer →
  strict type isolation → BetterAuth API Key plugin → middleware auth helpers →
  validated route handlers → API key management UI → docs update (siteConfig,
  README, /about, /privacy, /terms). All auth/authz in src/lib/middleware.ts.
  All shared types in src/types/ — never inline. Auth and billing pre-configured.
  Use /build-feature for internal dashboard-only features with no external API.
  Trigger: /build-api <description>  OR  /build-api then attach/paste a PRD.
---

# /build-api — API-First Feature Workflow

## Accepted Input

| Format | How to invoke |
|---|---|
| Inline description | `/build-api Create a projects CRUD API` |
| Attached PRD | `/build-api` then attach or `@` reference a `.md` / `.txt` file |
| Pasted PRD | `/build-api` then paste the PRD body into the chat |

Flag PRD ambiguities in the spec and wait for clarification before continuing.

---

## Pre-Flight: Skills

`api-design`, `prisma-expert`, `typescript-expert`, `better-auth-best-practices`,
`better-auth-security-best-practices`, `polar-billing`, `next-best-practices`, `react-best-practices`, `shadcn`.

---

## Agent Ownership

| Step | Agent | Files |
|---|---|---|
| Schema | DB Agent | `prisma/schema.prisma`, `prisma/migrations/` |
| Server + Plugin + Routes | Server Agent | `src/server/*.ts`, `src/lib/auth.ts`*, `src/lib/auth-client.ts`, `src/lib/middleware.ts`, `src/app/api/**` |
| Types | Types Agent | `src/types/*.ts` |
| UI | UI Agent | `src/app/dashboard/**`, `src/components/**` |
| Docs | Docs Agent | `src/config/site.ts`, `README.md`, `src/app/about/`, `src/app/privacy/`, `src/app/terms/` |

\* `auth.ts` edited only to add the `apiKey` plugin — never restructure existing plugins.
Order: DB Agent → Server Agent → Types Agent → UI Agent + Docs Agent (parallel).

---

## Step 1 — Spec

**STOP — no code until approved.**

1. **Feature summary** — what the API does and its business purpose.
2. **Endpoints** — method, path, request/response shape, error responses + status codes.
3. **API key strategy** — single vs multiple configs; user-owned vs org-owned; permissions; rate limits; expiry; prefix; storage mode.
4. **Session auth** — any mixed-auth endpoints (API key OR cookie session)?
5. **Billing gate** — required plan; which plan can create keys?
6. **Schema changes** — new models/fields, or "none needed".
7. **Server functions** — query functions + mutations for `src/server/`.
8. **Type exports** — domain file name (`src/types/projects.ts`) + shapes: Prisma payloads, response types, error literal union.
9. **Middleware impact** — new helpers needed in `src/lib/middleware.ts`?
10. **API Key UI** — list, create dialog, revoke; any extras?
11. **Docs impact** — one-liner per: `siteConfig`, `README`, `/about`, `/privacy`, `/terms`.
12. **Out of scope** — PRD items excluded this iteration.

**Wait for explicit approval. Revise and re-wait on feedback.**

---

## Step 2 — Schema (DB Agent)

Load `prisma-expert`. Apply spec changes.

> BetterAuth owns the `apiKey` table via `npx auth migrate`. Never add `api_keys` to `schema.prisma`.

Every model: `id` (cuid), `createdAt`, `updatedAt`, `deletedAt?` — all `@map` snake_case. Table names `snake_case` plural. `$transaction` for multi-step writes.

```bash
npm run db:format && npm run db:migrate && npm run db:generate
```
**Handoff:** "DB Agent done. Models: [list]. Migration: [name]. Prisma regenerated."

---

## Step 3 — Server Layer (Server Agent)

Load `prisma-expert` + `typescript-expert`. Create/update `src/server/` files.

- Prisma only from `@/lib/prisma`; `select` on every query; env vars from `@/env`
- Explicit `Promise<T>` on all async functions; JSDoc on every export; `$transaction` for multi-step writes
- Action return types **must** reference the discriminated union from `src/types/` (Step 4). Stub the import if running sequentially.

---

## Step 4 — Types (Types Agent)

**Runs after Server Agent, before UI Agent. Types Agent owns `src/types/`.**

One domain file per feature. Re-export from `src/types/index.ts`.

```ts
// src/types/projects.ts
import type { Prisma } from "@prisma/client"

// Prisma payload — derived, never hand-written
export const projectSelect = { id: true, name: true, createdAt: true } satisfies Prisma.ProjectSelect
export type Project = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>

// Error codes — string literals only, never bare string
export type ApiErrorCode = "UNAUTHORIZED" | "MISSING_KEY" | "INVALID_KEY" | "PLAN_REQUIRED" | "VALIDATION_ERROR" | "NOT_FOUND"
export type ApiError = { error: { code: ApiErrorCode; message: string; issues?: unknown } }

// Route response types — used by handlers and any client SDK
export type ProjectListResponse = { data: Project[]; meta: { total: number; limit: number; offset: number } }
```

`src/types/index.ts`: add `export * from "./projects"`.

Rules: no shared type in `src/server/`; Prisma payloads via `XxxGetPayload<>` only; error codes are string literals; `index.ts` always re-exports every domain file.

**Handoff:** "Types Agent done. Files: [list]. index.ts updated."

---

## Step 5 — API Key Plugin (Server Agent)

Load `better-auth-best-practices` + `better-auth-security-best-practices`.

**5a.** Scan `auth.ts` for `@better-auth/api-key`. If found, skip to 5d.
**5b.** `npm install @better-auth/api-key`
**5c.** Add to `src/lib/auth.ts` before `nextCookies()`:
```ts
import { apiKey } from "@better-auth/api-key"
apiKey([{ defaultPrefix: "sk_", enableMetadata: true,
  rateLimit: { enabled: true, maxRequests: 1000, timeWindow: 3600000 } }]),
nextCookies(), // MUST stay last
```
Never set `enableSessionForAPIKeys`. Multiple configs only if spec requires distinct key types.
**5d.** Add `apiKeyClient()` from `@better-auth/api-key/client` to `auth-client.ts` plugins.
**5e.** `npx auth migrate` — verify in `npm run db:studio`.

---

## Step 6 — Middleware Extension (Server Agent)

Load `better-auth-best-practices`. **All auth/authz logic lives in `src/lib/middleware.ts`.**
Extend it — never write auth inline in route handlers.

```ts
// src/lib/middleware.ts — extend, never remove existing exports
import { auth } from "@/lib/auth"
import { checkUserEntitlement } from "@/server/subscription"

export async function requireApiKey(req: Request) {
  const key = req.headers.get("x-api-key")
  if (!key) return { valid: false, ownerId: null, error: "MISSING_KEY" as const }
  const v = await auth.api.verifyApiKey({ body: { key } })
  return v.valid ? { valid: true, ownerId: v.key!.referenceId, error: null }
                 : { valid: false, ownerId: null, error: "INVALID_KEY" as const }
}
export async function requirePlan(userId: string, plan: "pro" | "team") {
  const ok = await checkUserEntitlement(userId, plan)
  return ok.allowed ? { allowed: true, error: null } : { allowed: false, error: "PLAN_REQUIRED" as const }
}
export async function requireSession(h: Headers) {
  const s = await auth.api.getSession({ headers: h })
  return s ? { session: s, error: null } : { session: null, error: "UNAUTHORIZED" as const }
}
// Mixed-auth: add requireApiKeyOrSession() if spec requires it
```

Helper errors are `as const` literals — they match `ApiErrorCode` in `src/types/` directly.

## Step 7 — Route Handlers (Server Agent)

Load `api-design`. Every handler: import helpers from `@/lib/middleware`, types from `@/types`.

```ts
import { requireApiKey, requirePlan } from "@/lib/middleware"
import type { ApiError, ProjectListResponse } from "@/types"

export async function GET(req: Request): Promise<NextResponse<ProjectListResponse | ApiError>> {
  const { valid, ownerId, error } = await requireApiKey(req)
  if (!valid) return NextResponse.json({ error: { code: error!, message: "Unauthorized" } }, { status: 401 })

  const { allowed, error: planErr } = await requirePlan(ownerId!, "pro")
  if (!allowed) return NextResponse.json({ error: { code: planErr!, message: "Pro plan required" } }, { status: 403 })

  const items = await getProjectsByUser(ownerId!)         // no Prisma in handlers
  return NextResponse.json({ data: items, meta: { total: items.length, limit: 50, offset: 0 } })
}
```

Validate all input with Zod — never raw `req.json()`. Codes: 200/201 · 401 · 403 · 422 · 429 · 500.

---

## Step 8 — API Key Management UI (UI Agent)

Types Agent must have handed off. Load `next-best-practices` + `react-best-practices` + `shadcn`.

**Page** (`src/app/dashboard/settings/api-keys/`): Server Component. Requires `page.tsx`,
`loading.tsx`, `error.tsx`. Fetch with `auth.api.listApiKeys({ headers: await headers() })` — no Prisma.

**`ApiKeyList`** (Client Component): props typed from `@/types`; `authClient.apiKey.delete()` on revoke; updates local state — no refetch.

**`CreateApiKeyDialog`** (Client Component — one-time reveal): "form" step → `authClient.apiKey.create()`; "reveal" step → show `data.key` once; `onPointerDownOutside` blocked; close disabled until copied; `onCreated` passes record (no raw key) to list. Never import `@/lib/auth` — use `auth-client` only.

**Nav**: add `{ label: "API Keys", href: "/dashboard/settings/api-keys" }` to settings nav.

---

## Step 9 — Docs Update (Docs Agent)

Targeted additions only. Runs in parallel with UI Agent. All copy uses the project name
and language from `src/config/site.ts` — never hardcode product names.

**`src/config/site.ts`**: add feature to `features` array; update nav/pricing config.
**`README.md`**: one Features bullet; add/update API Authentication section (`x-api-key` header, key generation location); update Tech stack if new deps added.
**`/about`**: one benefit-focused non-technical paragraph. Create if absent; note in handoff.
**`/privacy`**: add API key storage clause ("hashed, shown once, revocable"). Create if absent; note.
**`/terms`**: if plan-gated, add clause on required plan + limits. Skip if no new obligations; create if absent; note.

---

## Step 10 — Verification Checklist

**API Key Plugin**
- [ ] `@better-auth/api-key` in `package.json`; `apiKey([...])` before `nextCookies()` in `auth.ts`
- [ ] `apiKeyClient()` in `auth-client.ts`; `npx auth migrate` run; table confirmed
- [ ] `enableSessionForAPIKeys` NOT set; no `api_keys` in `schema.prisma`

**Middleware**
- [ ] `requireApiKey()`, `requirePlan()`, `requireSession()` in `src/lib/middleware.ts`
- [ ] No inline `verifyApiKey()` or `getSession()` calls in route handlers
- [ ] Helper errors are `as const` literals matching `ApiErrorCode`

**Type Isolation**
- [ ] Domain type file in `src/types/`; `index.ts` re-exports it
- [ ] Prisma payloads via `Prisma.XxxGetPayload<>` — none hand-written
- [ ] `ApiErrorCode` is a string literal union — not bare `string`
- [ ] Handler return types imported from `@/types` — no inline type defs in handlers
- [ ] No `@/server/*` imports in Client Components — types from `@/types` only

**Route Handlers**
- [ ] Auth via `requireApiKey()` / `requireApiKeyOrSession()` — before any DB call
- [ ] All input validated with Zod; standard `{ data }` / `{ error }` response shape
- [ ] Correct status codes; no Prisma in handlers

**Auth & Billing**
- [ ] Billing gate server-side; `403` with `code: "PLAN_REQUIRED"` and `requiredPlan`

**API Key UI**
- [ ] List page + `loading.tsx` + `error.tsx` present
- [ ] One-time reveal: key shown once; close blocked until copied
- [ ] Revoke via `authClient.apiKey.delete()`; `@/lib/auth.ts` not in any Client Component
- [ ] Props typed from `@/types`; all classes via `cn()`

**Docs**
- [ ] `siteConfig` features updated
- [ ] `README.md` features + API auth section updated
- [ ] `/about` updated or created (note if created)
- [ ] `/privacy` updated or created with API key storage clause
- [ ] `/terms` updated, skipped with reason, or created

**TypeScript**
- [ ] No `any`; explicit return types everywhere; env vars from `@/env`; no `as X` without comment
