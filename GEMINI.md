# GEMINI.md — Antigravity Agent Configuration
# Extends AGENTS.md with Antigravity-specific orchestration rules

@AGENTS.md

---

## Agent Behaviour in Manager View

| Domain         | Owns                                                                          | Must not touch              |
| -------------- | ----------------------------------------------------------------------------- | --------------------------- |
| DB Agent       | `schema.prisma`, `migrations/`                                                | `app/`, `components/`       |
| Server Agent   | `server/*.ts`, `app/api/`, `lib/middleware.ts`, `lib/auth.ts`*                | `components/`, `prisma/`    |
| Types Agent    | `src/types/*.ts`                                                              | `app/`, `components/`, `prisma/` |
| UI Agent       | `components/`, `app/(authenticated)/dashboard/`, `app/(auth)/sign-in/`, `app/(auth)/sign-up/`                  | `lib/`, `prisma/`, `types/` |
| Docs Agent     | `README.md`, `src/config/site.ts`, `app/(public)/about/`, `app/(public)/privacy/`, `app/(public)/terms/` | `lib/`, `server/`, `prisma/`|
| Auth Agent     | `lib/auth.ts`, `lib/auth-client.ts`, `middleware.ts` (root)                  | `polar.ts`, `prisma/`       |
| Billing Agent  | `lib/polar.ts`, `server/subscription.ts`, `app/api/`                         | `auth.ts`, `prisma/`        |

\* Server Agent may edit `lib/auth.ts` **only** to add the `@better-auth/api-key` plugin
during `/build-api` Step 4. No other structural changes to `auth.ts` are permitted outside Auth Agent.

Rules for parallel execution:
- Only ONE agent may modify `schema.prisma` at a time. Never run concurrent migrations.
- Types Agent runs after Server Agent completes — before UI Agent begins. No exceptions.
- UI Agent and Docs Agent may run in parallel once Types Agent has handed off.
- Always show a plan in Manager view before executing a multi-file task.
- Each agent must output a handoff summary before the next begins.

---

## Skill Assignments

| Skill                                   | Trigger keywords |
| --------------------------------------- | ---------------- |
| `api-design`                            | api, endpoint, webhook, validation, REST, contracts, versioning |
| `better-auth-best-practices`            | auth, session, login, OAuth, middleware, permissions, api key, apiKey |
| `better-auth-security-best-practices`   | auth security, csrf, brute force, cookie, session hardening, key exposure |
| `polar-billing`                         | billing, subscription, checkout, webhook, entitlement, pricing, plan, upgrade |
| `prisma-expert`                         | schema, migration, model, database, query, transaction |
| `next-best-practices`                   | page, route, layout, Server Component, Server Action, app router, loading, error |
| `react-best-practices`                  | hooks, components, performance, state management, useFormState, useActionState |
| `shadcn`                                | shadcn, ui component, tailwind, primitive, component styling, cn() |
| `typescript-expert`                     | typescript, strict, generics, type safety, Zod, unknown, type guard, discriminated union |
| `zustand-manager`                       | store, global state, persist, selector, Zustand, useShallow, modal state, toast |

Project skills override community skills when they conflict.

---

## Workflows

Both workflows live under `.agent/workflows/` and accept a plain description OR a PRD
(attached file, `@` reference, or pasted content). PRD ambiguities must be flagged in
the spec step and require clarification before any code is written.

### `/build-api` — API-First Feature

Use when the primary deliverable is API routes consumed externally. Includes
`@better-auth/api-key` plugin setup, companion API key management UI, and docs update.

| Step | What happens |
|---|---|
| 1 | Spec — parse PRD/description → structured plan → **wait for approval** |
| 2 | Schema — DB Agent; BetterAuth owns `apiKey` table via `npx auth migrate` |
| 3 | Server layer — query functions + Server Actions in `src/server/` |
| 4 | API Key plugin — install, add to `auth.ts` + `auth-client.ts`, run `npx auth migrate` |
| 5 | Auth & billing — `requireApiKey()` / `requirePlan()` from `src/lib/middleware.ts` |
| 6 | Route handlers — Zod validation, standard `{ data }` / `{ error }` response shape |
| 7 | API Key management UI — list page, one-time reveal dialog, revoke action |
| 8 | Types — domain files in `src/types/`; re-export from `index.ts` |
| 9 | Docs — `siteConfig`, `README.md`, `/about`, `/privacy`, `/terms` |
| 10 | Verification checklist |

**Key constraints:**
- `enableSessionForAPIKeys` is NEVER set
- `apiKey` table never added to `schema.prisma`
- All route handler auth via helpers from `src/lib/middleware.ts` — no inline auth
- Create dialog blocks close until key is copied (one-time reveal enforced)
- `src/lib/auth.ts` only touched to add the plugin — existing plugin order preserved
- Docs step is mandatory — skip individual pages only if they don't exist, and note it

### `/build-feature` — Full-Stack SaaS Feature

Use when the feature includes a user-facing dashboard UI. Server layer and types before
any UI. Docs step always runs.

| Step | What happens |
|---|---|
| 1 | Spec — parse PRD/description → structured plan → **wait for approval** |
| 2 | Schema — DB Agent |
| 3 | Server layer — query functions + Server Actions in `src/server/` |
| 4 | Types — domain files in `src/types/`; Types Agent runs; re-export from `index.ts` |
| 5 | Auth, billing & middleware — extend `src/lib/middleware.ts`; session + plan gates |
| 6 | API surface — conditional; only for webhooks or external consumption |
| 7 | UI — pages → Server Components → Client Components → Zustand → styling |
| 8 | Docs — `siteConfig`, `README.md`, `/about`, `/privacy`, `/terms` |
| 9 | Verification checklist |

**Key constraints:**
- No component built before the Server Action it calls exists
- Types step runs after server layer, before UI — no exceptions
- All shared types in `src/types/`; Client Components import from `@/types` not `@/server`
- All auth/authz via helpers in `src/lib/middleware.ts` — never inline
- `"use client"` only for event handlers, browser APIs, stateful hooks
- `@/lib/auth.ts` never imported in a Client Component — use `auth-client.ts`
- Docs step is mandatory; skip individual pages only if they don't exist, and note it

### Choosing the right workflow

| Situation | Workflow |
|---|---|
| REST API for external consumers | `/build-api` |
| Webhook receiver | `/build-api` |
| API key management settings | `/build-api` |
| Dashboard page + form | `/build-feature` |
| Internal settings flow | `/build-feature` |
| Feature needs both UI and external API | `/build-api` (includes UI steps) |

---

## Feature Implementation Order

When building any new SaaS feature, agents MUST follow this sequence:

1. **Spec** — structured plan from PRD or description; explicit approval before any code.
2. **Schema** — `schema.prisma` update; format, migrate, generate.
3. **Server layer** — Server Actions and query functions in `src/server/`.
4. **Types** — domain type files in `src/types/`; re-export from `index.ts`. Always before UI.
5. **Auth/Billing/Middleware** — extend `src/lib/middleware.ts`; session and plan gates.
6. **API surface** — only for webhooks or external consumption. Skip otherwise.
7. **UI** — Server Components first, Client Components only where required.
8. **Docs** — `siteConfig`, `README.md`, `/about`, `/privacy`, `/terms`. Not optional.

Never skip or reorder. Types before UI. Docs last, always.

---

## Type Isolation — Project Rules

- **`src/types/` is the only location** for types shared between server and client.
  Never define a shared type inline in `src/server/` or in a component file.
- **One file per domain:** `src/types/invitations.ts`, `src/types/projects.ts`, etc.
  `src/types/index.ts` must `export *` from every domain file — always kept current.
- **Prisma payloads derived, never written:** `Prisma.XxxGetPayload<{ select: typeof xSelect }>`.
- **Server Action results** are discriminated unions with string literal error codes:
  `{ success: false; error: "UNAUTHORIZED" | "PLAN_REQUIRED" }` — never bare `string`.
- **Client Components import from `@/types`** — never from `@/server`.
- **Types Agent** owns `src/types/`. Runs after Server Agent, before UI Agent.

---

## Middleware — Project Rules

- **`src/lib/middleware.ts` is the single source** for reusable auth and authz helpers.
  Every route handler and Server Action imports from here — no ad-hoc auth inline.
- **Never write auth logic directly** in a handler or action. Add it to `src/lib/middleware.ts`
  first, then import it.
- **Canonical helpers** (always present, extend as needed):
  - `requireSession(headers)` — session guard; returns `{ session, error: "UNAUTHORIZED" | null }`
  - `requirePlan(userId, plan)` — plan gate; returns `{ allowed, error: "PLAN_REQUIRED" | null }`
  - `requireApiKey(req)` — API key guard; returns `{ valid, ownerId, error: literal | null }`
- Helper error returns use `as const` literals — they flow directly into `src/types/` unions.
- `src/lib/middleware.ts` ≠ `middleware.ts` (root). Root file handles Next.js route
  interception. `src/lib/middleware.ts` provides helper functions for use inside code.

---

## Docs Policy — Project Rules

- **`src/config/site.ts` is the single source of truth** for product name, tagline,
  feature list, and nav config. All other files derive copy from it. Never hardcode elsewhere.
- **After every feature:** update `siteConfig` and `README.md` — no exceptions.
- **When new user data is stored:** update `/privacy` — what collected, retention, sharing.
- **When plan limits or obligations change:** update `/terms`.
- **When a new user-visible capability ships:** update `/about`.
- **If a docs page doesn't exist:** create it — do not skip silently. Note in handoff.
- All docs copy must use the product name and language from `siteConfig`.

---

## API Key Plugin — Project Rules

- Config source: `src/lib/auth.ts` — the `apiKey([...])` call only.
- Client methods: `authClient.apiKey.*` from `src/lib/auth-client.ts` only.
- Server verification: `requireApiKey()` from `src/lib/middleware.ts` — wraps `verifyApiKey()`.
- `enableSessionForAPIKeys` is permanently off. Use `referenceId` to identify key owner.
- BetterAuth owns `apiKey` table — never add to `schema.prisma`.
  `npx auth migrate` owns this table; `prisma migrate` owns app models.
- One-time reveal: create dialog blocks close until key is copied.
- Billing gate on key creation enforced in Server Action — not in UI.

---

## DESIGN SYSTEM ENFORCEMENT (HIGHEST PRIORITY)

`DESIGN-SYSTEM.md` contains the single source of truth for all UI decisions in this project.

**You are required to:**
- Read `DESIGN-SYSTEM.md` **before every single UI task**.
- Strictly use only the semantic CSS variables from `globals.css`.
- **Always prefer official shadcn/ui components** (AlertDialog, Sidebar, NavigationMenu, Card, Button variants, Table, etc.) over writing custom Tailwind from scratch.
- Reject any approach that uses hardcoded colors or bypasses shadcn components.

**Violation = Failure.** 
If you generate code that breaks these rules, you must immediately correct it in the next step.

Reference: `DESIGN-SYSTEM.md` + `globals.css`

---

## Global Never-Do List (Supplement to AGENTS.md §12)

### Types
- Never define a shared type in `src/server/` — use `src/types/`.
- Never import `@/server/*` in a Client Component — import types from `@/types`.
- Never hand-write a Prisma payload type — use `Prisma.XxxGetPayload<>`.
- Never use bare `string` as a Server Action error — use string literal unions.
- Never leave a new domain type file out of `src/types/index.ts` re-exports.

### Middleware
- Never write inline auth logic in a route handler or Server Action.
- Never add a new auth pattern without first adding it to `src/lib/middleware.ts`.

### API Keys
- Never enable `enableSessionForAPIKeys`.
- Never add `api_keys` to `schema.prisma`.
- Never call `verifyApiKey()` directly in a handler — use `requireApiKey()`.

### Patterns
- Never build a UI component before its Server Action exists.
- Never run the Types step after the UI step — types always come first.
- Never create an API route for a form mutation — use Server Actions.
- Never call `useStore.getState()` inside a React render — use the hook.
- Never import `src/lib/auth.ts` in a Client Component — use `auth-client.ts`.

### Docs
- Never ship a feature without updating `siteConfig` and `README.md`.
- Never leave `/about`, `/privacy`, or `/terms` stale after a feature that affects them.
- Never hardcode product name or copy — always derive from `siteConfig`.