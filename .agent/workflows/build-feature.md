---
description: >Scaffold a complete full-stack SaaS feature: PRD/description → schema → server   layer → strict type isolation → auth/billing via middleware helpers → optional   API surface → Server Components → Client Components → project docs update
---

---
description: >
  Scaffold a complete full-stack SaaS feature: PRD/description → schema → server
  layer → strict type isolation → auth/billing via middleware helpers → optional
  API surface → Server Components → Client Components → project docs update
  (README, siteConfig, /about, /privacy, /terms).
  Auth (BetterAuth) and billing (Polar plugin) are pre-configured — never touch
  their core setup. src/lib/middleware.ts is the single source for auth helpers.
  All types shared between server and client live in src/types/ — never inline.
  Use /build-api when the primary deliverable is an external API surface.
  Trigger: /build-feature <description>  OR  /build-feature then attach/paste a PRD.
---

# /build-feature — Full-Stack SaaS Feature Workflow

Server layer first, always. No component before the Server Action it calls.
Types shared between server and client always live in `src/types/` — never inline.

---

## Accepted Input

| Format | How to invoke |
|---|---|
| Inline description | `/build-feature Add a team member invite flow` |
| Attached PRD | `/build-feature` then attach or `@` reference a `.md` / `.txt` file |
| Pasted PRD | `/build-feature` then paste the PRD body into the chat |

Flag PRD ambiguities in the spec and wait for clarification before continuing.

---

## Pre-Flight: Skills

`prisma-expert`, `typescript-expert`, `better-auth-best-practices`, `polar-billing`,
`next-best-practices`, `react-best-practices`, `shadcn`. Add `api-design` if Step 6 runs.

---

## Agent Ownership

| Step | Agent | Files |
|---|---|---|
| Schema | DB Agent | `prisma/schema.prisma`, `prisma/migrations/` |
| Server + Middleware + Routes | Server Agent | `src/server/*.ts`, `src/lib/middleware.ts`, `src/app/api/**` |
| Types | Server Agent | `src/types/*.ts` |
| UI | UI Agent | `src/app/dashboard/**`, `src/components/**`, `src/zustand/stores/**` |
| Docs | UI Agent | `README.md`, `src/config/site.ts`, `src/app/about/`, `src/app/privacy/`, `src/app/terms/` |

Only ONE agent may touch `schema.prisma` at a time. DB → Server → UI. Handoff required at each.

---

## Step 1 — Spec

**STOP — no code until approved.**

Parse the PRD or description and produce a spec covering:

1. **Feature summary** — what it does and its business purpose.
2. **Who can use it** — roles and required Polar plan (free / pro / team).
3. **Schema changes** — new models/fields/relations, or explicitly "none needed".
4. **Server functions** — query functions + mutations. For each mutation: Server Action (default) or API route (webhooks/external only)?
5. **Type exports** — every type shared between server and client. Name the file and list shapes (Prisma payloads, action result unions, input types).
6. **Middleware impact** — new helpers needed in `src/lib/middleware.ts`? Describe them.
7. **API surface** — any endpoints consumed externally? Step 6 runs if yes, skipped if no.
8. **UI breakdown** — pages/layouts (path, data); components (name, server vs client); shadcn primitives; Zustand stores (name, shape); segments needing `loading.tsx` / `error.tsx`.
9. **SEO** — pages needing `generateMetadata()`.
10. **Docs impact** — one-line summary per file: README, siteConfig, /about, /privacy, /terms.
11. **Out of scope** — anything from the PRD not built this iteration.

**Wait for explicit approval. Revise and re-wait if the user comments.**

---

## Step 2 — Schema (DB Agent)

Load `prisma-expert`. Apply spec schema changes.

Every model: `id` (cuid), `createdAt`, `updatedAt`, `deletedAt?` — all with `@map` snake_case columns. Table names `snake_case` plural. `@map` every camelCase field. Multi-step writes → `$transaction`.

```bash
npm run db:format && npm run db:migrate && npm run db:generate
```
**Handoff:** "DB Agent done. Models: [list]. Migration: [name]. Prisma regenerated."

---

## Step 3 — Server Layer (Server Agent)

Load `prisma-expert` + `typescript-expert`. Create/update `src/server/` files.

- Prisma only from `@/lib/prisma`; env vars only from `@/env`
- `select` on every query — no sensitive full rows
- Explicit `Promise<T>` return types on all async functions; JSDoc on every export
- Server Action return types **must** reference the discriminated union from `src/types/` (Step 4) — not an inline type
- `"use server"` at top of every Server Action file
- Validate all input with Zod before any data access
- `$transaction` for multi-step writes; `revalidatePath()` / `revalidateTag()` after mutations

**Type boundary rule:** Any type consumed by both a server function and a component is defined in `src/types/` only. Components import types from `@/types` — never from `@/server`.

---

## Step 4 — Types (Server Agent)

**Run immediately after Step 3, before any UI work.**

Create domain-scoped files in `src/types/`. Re-export everything from `src/types/index.ts`.

```ts
// src/types/invitations.ts
import type { Prisma } from "@prisma/client"

// 1. Prisma payload — derive, never hand-write
export const invitationSelect = {
  id: true, email: true, role: true, status: true, expiresAt: true, createdAt: true,
} satisfies Prisma.InvitationSelect
export type Invitation = Prisma.InvitationGetPayload<{ select: typeof invitationSelect }>

// 2. Action result — discriminated union, literal error codes only (never bare string)
export type InviteMemberResult =
  | { success: true; invitationId: string }
  | { success: false; error: "UNAUTHORIZED" | "PLAN_REQUIRED" | "ALREADY_INVITED" | "INVALID_INPUT" }

// 3. Input type — mirrors Zod schema shape
export type InviteMemberInput = { email: string; role: "admin" | "member" }
```

`src/types/index.ts` must re-export all domain files: `export * from "./invitations"`

---

## Step 5 — Auth, Billing & Middleware (Server Agent)

Load `better-auth-best-practices` + `polar-billing`.

### 5a. Extend `src/lib/middleware.ts`

This file is the **single source** for reusable auth/authz helpers. Route handlers
and Server Actions import from here — never write ad-hoc auth logic inline.

Add helpers the spec requires (extend; never remove existing exports):

```ts
// src/lib/middleware.ts
import { auth } from "@/lib/auth"
import { checkUserEntitlement } from "@/server/subscription"

export async function requireSession(h: Headers) {
  const session = await auth.api.getSession({ headers: h })
  return session ? { session, error: null } : { session: null, error: "UNAUTHORIZED" as const }
}
export async function requirePlan(userId: string, plan: "pro" | "team") {
  const ok = await checkUserEntitlement(userId, plan)
  return ok.allowed ? { allowed: true, error: null } : { allowed: false, error: "PLAN_REQUIRED" as const }
}
// Also used by /build-api route handlers
export async function requireApiKey(req: Request) {
  const key = req.headers.get("x-api-key")
  if (!key) return { valid: false, ownerId: null, error: "MISSING_KEY" as const }
  const v = await auth.api.verifyApiKey({ body: { key } })
  return v.valid
    ? { valid: true, ownerId: v.key!.referenceId, error: null }
    : { valid: false, ownerId: null, error: "INVALID_KEY" as const }
}
```

In Server Actions: `const { session, error } = await requireSession(await headers())`
— `error` is a literal that matches the discriminated union in `src/types/`.

### 5b. Dashboard route protection

Root `middleware.ts` already protects all `(dashboard)` routes — don't add redirect
logic to pages already covered. Add session/plan checks only for routes that require
additional role or plan gates beyond basic auth.

---

## Step 6 — API Surface (Server Agent, conditional)

**Skip if spec says no external surface.** Load `api-design` if this step runs.

Create route handlers in `src/app/api/` only for webhooks, external consumption, or
operations unsuitable for Server Actions. Never replace Server Actions with API routes
for form mutations. All handlers call `requireSession()` or `requireApiKey()` from
`src/lib/middleware.ts` — no ad-hoc auth inline.
Response shape: `{ data: T }` / `{ error: { code, message } }`.

---

## Step 7 — UI (UI Agent)

Server Agent must have handed off. Load `next-best-practices` + `react-best-practices` + `shadcn`.
Build in this sub-order — do not skip ahead.

**7a. Pages and layouts** (`src/app/dashboard/`):
- `loading.tsx` + `error.tsx` for every dynamic segment — no exceptions
- `generateMetadata()` on public/indexable pages
- Default: Server Component — fetch data via `src/server/` functions
- Named exports only; default export only for `page.tsx` / `layout.tsx`

**7b. Server Components**: render data, no hooks, no event handlers. Props typed from `@/types`.

**7c. Client Components** — `"use client"` only for event handlers, browser APIs, stateful hooks:
- `@/lib/auth-client` for session — never `@/lib/auth`; types from `@/types` — never `@/server`
- Never call Prisma; `useActionState` (React 19) for Server Action–backed forms

**7d. Zustand stores** (if spec requires): `src/zustand/stores/` only.
✅ modal, sidebar, wizard step, toast, drawer · ❌ session, plan status, DB data

**7e. Styling**: `cn()` for all classes; Tailwind only; never edit `@/components/ui/`;
install new shadcn components with `npx shadcn@latest add <component>`.

---

## Step 8 — Docs Update (UI Agent)

Targeted additions only — do not rewrite content that is still accurate.
All copy must use the project's real name and product language from `src/config/site.ts`.

**`src/config/site.ts`**: update the `features` array and any nav/pricing config the feature affects.

**`README.md`**: one bullet in Features; update Tech stack if new deps added; add/update Usage sub-section if workflow is non-obvious.

**`/about`**: one benefit-focused paragraph in product terms (non-technical). Skip and note if page doesn't exist.

**`/privacy`**: if new user data is stored, add a clause — what is collected, retention, third-party sharing. Skip if no new data types; skip and note if page doesn't exist.

**`/terms`**: if new usage limits, plan gates, or user obligations are introduced, add a clause to the relevant section. Skip if none; skip and note if page doesn't exist.

---

## Step 9 — Verification Checklist

Mark done only when verified in actual code.

**Server Layer**
- [ ] `"use server"` at top of every Server Action file
- [ ] All async functions have explicit return types; JSDoc on all exports
- [ ] `select` on every Prisma query; `$transaction` for multi-step writes
- [ ] `revalidatePath()` / `revalidateTag()` after every mutation
- [ ] Env vars from `@/env` only

**Type Isolation**
- [ ] Every shared type in `src/types/` — none inline in `src/server/`
- [ ] `src/types/index.ts` re-exports all domain type files
- [ ] Server Action results are discriminated unions with literal error codes
- [ ] No `@/server/*` imports in any Client Component — types from `@/types` only
- [ ] No hand-written Prisma payloads — `Prisma.XxxGetPayload<>` everywhere

**Middleware**
- [ ] New auth/authz helpers added to `src/lib/middleware.ts`, not inlined
- [ ] Server Actions use `requireSession()` from `src/lib/middleware.ts`
- [ ] Plan gates use `requirePlan()` from `src/lib/middleware.ts`
- [ ] No duplicate auth logic across files

**Auth & Billing**
- [ ] Session check is first in every Server Action touching user data
- [ ] Billing gate enforced server-side; error codes match type union literals
- [ ] No client-side-only feature gating

**API Routes (if Step 6 ran)**
- [ ] All handlers use `requireSession()` / `requireApiKey()` from `src/lib/middleware.ts`
- [ ] Input validated with Zod; standard response shape enforced

**UI**
- [ ] `"use client"` only where genuinely required
- [ ] `@/lib/auth` not imported in Client Components; types from `@/types` not `@/server`
- [ ] No Prisma in Client Components
- [ ] `loading.tsx` + `error.tsx` present for every dynamic segment
- [ ] All classes via `cn()`; no `@/components/ui/` edits; Zustand stores in correct location

**Docs**
- [ ] `src/config/site.ts` updated with new feature
- [ ] `README.md` features section u