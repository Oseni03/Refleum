# AGENTS.md — SaaS Boilerplate: Source of Truth

# Read by: Antigravity, Roo Code, Cline, GitHub Copilot, Gemini CLI, Windsurf

---

## 1. Project Identity

API-first resume tailoring SaaS built with Next.js App Router 16.2.6, Prisma ORM 6.16.2, PostgreSQL,
Better Auth 1.8.3, Tailwind CSS 4, shadcn/ui, TypeScript strict, and AI integrations.

Deployment target: Vercel (frontend + serverless functions).
Database host: Neon / PostgreSQL. Connection pooling via Prisma Accelerate.
Package manager: npm. Monolith (not monorepo).

---

## 2. Directory Map

```
src/
├── app/                            # Next.js App Router
│   ├── api/                        # API routes
│   │   ├── accept-invitation/      # Invitation handling
│   │   ├── auth/                   # Better Auth catch-all handler
│   │   ├── feedback/               # Feedback endpoints
│   │   ├── integrations/           # External integration APIs
│   │   ├── keys/                   # API key management
│   │   ├── reject-invitation/      # Invitation rejection
│   │   ├── subscription/           # Subscription/webhook API
│   │   └── v1/                     # Versioned public API
│   │       ├── health/             # Health check
│   │       ├── llm-config/         # LLM settings CRUD
│   │       └── resumes/            # Resume + generated-content APIs
│   │           ├── route.ts
│   │           └── [id]/
│   │               ├── cover-letters/
│   │               ├── outreach/
│   │               ├── pdf/
│   │               ├── retry/
│   │               ├── tailor/
│   │               └── route.ts
│   ├── (public)/about/             # Public about page
│   ├── (public)/contact/           # Contact page
│   ├── (public)/docs/              # Developer docs page
│   ├── (public)/privacy/           # Privacy page
│   ├── (public)/terms/             # Terms page
│   ├── (authenticated)/dashboard/  # Authenticated application pages
│   ├── (auth)/sign-in/             # Sign-in page
│   ├── (auth)/sign-up/             # Sign-up page
│   ├── favicon.ico
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Public home page
├── components/                     # React components
│   ├── ui/                         # shadcn/ui primitives — NEVER edit directly
│   ├── app-sidebar.tsx
│   ├── feedback-modal.tsx
│   ├── nav-main.tsx
│   ├── nav-user.tsx
│   ├── social-login-button.tsx
│   ├── team-switcher.tsx
│   ├── dashboard/
│   ├── docs/
│   ├── emails/
│   ├── forms/
│   ├── settings/
│   ├── theme/
│   └── zustand/
├── config/
│   └── site.ts                 # Site config — SINGLE SOURCE for name, description, features
├── hooks/
│   └── use-mobile.ts
├── lib/                        # Utility libraries
│   ├── api.ts                  # Shared API helpers and response constructors
│   ├── auth.ts                 # Better Auth server config (SINGLE SOURCE)
│   ├── auth-client.ts          # Better Auth browser client (SINGLE SOURCE)
│   ├── auth-utils.ts
│   ├── middleware.ts           # Auth/authz helpers — SINGLE SOURCE for requireSession, requireApiKey, requirePlan
│   ├── prisma.ts               # Prisma singleton (SINGLE SOURCE)
│   ├── polar.ts                # Polar client singleton (SINGLE SOURCE)
│   ├── resend.ts
│   ├── parser.ts               # Resume parsing helpers
│   ├── resume-utils.ts
│   ├── utils.ts
│   └── prompts/
├── server/                     # Server-side functions
│   ├── cover-letters.ts
│   ├── dashboard.ts
│   ├── integrations.ts
│   ├── llm-config.ts
│   ├── members.ts
│   ├── notifications.ts
│   ├── organizations.ts
│   ├── outreach.ts
│   ├── pdf.ts
│   ├── permissions.ts
│   ├── polar.ts
│   ├── resumes.ts
│   ├── security.ts
│   ├── subscription.ts
│   ├── users.ts
│   └── versions.ts
├── types/                      # Shared TypeScript types — SINGLE SOURCE for server↔client boundary
│   ├── index.ts                # Re-exports all domain type files
│   └── *.ts                    # One file per domain
├── zustand/
│   ├── providers/
│   └── stores/                 # Zustand store definitions — only here, never colocated
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

## 3. TypeScript Rules

- Strict mode always. `"strict": true` in tsconfig. No exceptions.
- No `any`. Use `unknown` and narrow with type guards.
- No `as X` casts unless you add an inline comment explaining why.
- Use `type` for object shapes and unions. Use `interface` only when extending.
- All async functions must have explicit return types.
- Zod schema is the validation layer for ALL external inputs:
  form data, API route params, webhook payloads, env vars.
- Env vars are validated at startup via `src/env.ts` using Zod.
  Never access `process.env.X` directly — always import from `@/env`.

### Type Isolation (server ↔ client boundary)

- **`src/types/` is the only place** shared types live. Never define a type inline
  in `src/server/` if it is consumed by a component or vice versa.
- **One file per domain.** Create `src/types/invitations.ts`, `src/types/projects.ts`,
  etc. `src/types/index.ts` must re-export all domain files with `export * from "./x"`.
- **Prisma payload types** are always derived, never hand-written:
  ```ts
  export type Invitation = Prisma.InvitationGetPayload<{ select: typeof invitationSelect }>
  ```
- **Server Action return types** must be a discriminated union with string literal error
  codes — never a bare `string`:
  ```ts
  export type InviteMemberResult =
    | { success: true; invitationId: string }
    | { success: false; error: "UNAUTHORIZED" | "PLAN_REQUIRED" | "ALREADY_INVITED" }
  ```
  The error literals must be defined in `src/types/` so Client Components can switch on them.
- **Client Components import types from `@/types`** — never from `@/server`.
  A component that needs the shape of a Server Action result imports it from `@/types/x`,
  not from the server file that defines the action.

---

## 4. Next.js App Router Patterns

- Server Components are the default. Add `"use client"` ONLY for:
    - Event handlers that can't be extracted to Server Actions
    - Browser-only APIs (window, localStorage, IntersectionObserver)
    - Stateful UI driven by hooks (useState, useEffect with subscriptions)
- Data fetching happens in Server Components via direct Prisma calls
  or query functions from `@/server/`.
- Mutations happen via Server Actions in `@/server/`.
  Never use API routes for form mutations — use Server Actions.
- API routes (`/app/api/`) are reserved for:
    - Third-party webhooks (Polar)
    - Better Auth catch-all handler
    - Endpoints consumed by external services
- Route protection: `middleware.ts` at project root intercepts all
  `(dashboard)` routes and validates session via Better Auth.
- Use `loading.tsx` and `error.tsx` for every dynamic segment.
- Use `generateMetadata()` for SEO on all public pages.
- Parallel routes (`@slot`) for modals that should be deep-linkable.

### Middleware helpers (`src/lib/middleware.ts`)

`src/lib/middleware.ts` is the **single source** for reusable auth and authz logic.
Route handlers and Server Actions must import from here — never write ad-hoc auth
checks inline. When a new auth pattern is needed, extend this file.

Canonical helpers:
- `requireSession(headers)` — returns `{ session, error: "UNAUTHORIZED" | null }`
- `requirePlan(userId, plan)` — returns `{ allowed, error: "PLAN_REQUIRED" | null }`
- `requireApiKey(req)` — returns `{ valid, ownerId, error: "MISSING_KEY" | "INVALID_KEY" | null }`

Server Action pattern:
```ts
const { session, error } = await requireSession(await headers())
if (error) return { success: false, error }  // error literal matches the type union
```

---

## 5. Database & Prisma Rules

- Prisma client SINGLETON in `@/lib/prisma.ts`. Never instantiate elsewhere.
- All DB access in Server Components, Server Actions, or API route handlers.
  Never call Prisma from a client component — ever.
- Schema conventions:
    - Table names: `snake_case`, plural (`users`, `subscriptions`, `api_keys`)
    - Every model must have:
        ```prisma
        id        String   @id @default(cuid())
        createdAt DateTime @default(now()) @map("created_at")
        updatedAt DateTime @updatedAt @map("updated_at")
        ```
    - Use `@map` to keep DB columns snake_case while Prisma fields are camelCase.
    - Soft deletes: add `deletedAt DateTime? @map("deleted_at")` — never hard-delete user data.
- Multi-step writes MUST use `prisma.$transaction([...])`.
- Use `select` to limit returned fields. Never return full user rows
  that include sensitive columns (passwordHash, tokens, secrets).
- After schema changes:
    1. Run `npm db:format` (`prisma format`)
    2. Run `npm db:migrate` (`prisma migrate dev --name <description>`)
    3. Run `npm db:generate` (`prisma generate`)
       Never use `prisma db push` outside of local prototype exploration.

---

## 6. Better Auth Rules

- Auth server config: `@/lib/auth.ts` — THE ONLY place auth is configured.
- Auth browser client: `@/lib/auth-client.ts` — THE ONLY client import.
- Session in Server Components: `auth.api.getSession({ headers: headers() })`
- Session in Client Components: `useSession()` from `@/lib/auth-client`
- Route protection: `middleware.ts` using `auth.api.getSession`.
  Redirect unauthenticated users to `/sign-in`.
- When adding OAuth providers:
    1. Update `@/lib/auth.ts` with the provider config
    2. Add required env vars to `.env.local` AND `.env.example`
    3. Add the callback URL to the provider's dashboard
- Never log raw session tokens, JWT payloads, or auth secrets.
- Better Auth catch-all: `app/api/auth/[...all]/route.ts` — do not modify its
  handler logic. Configure behaviour only in `@/lib/auth.ts`.

---

## 7. Polar.sh Billing Rules

- Polar client singleton: `@/lib/polar.ts`. Never instantiate elsewhere.
- Subscription status is the ONLY source of truth for feature gating.
  It lives in the `subscriptions` Prisma model, synced via webhooks.
- Webhook handlers should live under `app/api/` when added.
    - ALWAYS verify the webhook signature before processing.
    - Idempotency: check if the event has already been processed before writing.
    - Update the DB synchronously within the handler — don't queue it.
- Entitlement checks: implement billing status lookups in `@/server/subscription.ts`.
  Call those functions via `requirePlan()` in `@/lib/middleware.ts`.
- Never gate features on the client side only — always enforce on the server.
- Checkout sessions are created via Server Actions, not API routes.

---

## 8. Component & Styling Rules

- shadcn/ui components live in `@/components/ui/`. NEVER edit these files.
  Customise by composing primitives in `src/components/` or feature folders.
- Install components: `npx shadcn@latest add <component>` — never manually copy.
- All class names via `cn()` from `@/lib/utils`. Never string-concatenate classes.
- Tailwind only. No inline `style={{}}`. No separate CSS files except globals.css.
- Named exports for all components. No default exports except page/layout files.
- Component file naming: `kebab-case.tsx`.
- Compound component pattern for complex UI (e.g., `Card`, `Card.Header`, `Card.Body`).

### DESIGN SYSTEM ENFORCEMENT (HIGHEST PRIORITY)

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

## 9. State Management (Zustand)

- Zustand stores live in `@/zustand/stores/` only — never colocated with components.
- Always use the `create<T>()(...)` pattern with an explicit TypeScript interface.
- Use `useShallow` from `zustand/shallow` for all object selectors.
  This prevents unnecessary re-renders when only one field in a slice changes.
- Never call `useStore.getState()` inside a React component — use the hook.
- If a store name ends in `-persistent`, apply the `persist` middleware
  with `localStorage` and a versioned `name` key.
- Stores hold ONLY transient UI state (modals, sidebar, wizard steps).
  Server state (user data, subscriptions) lives in Server Components / React Query.

---

## 10. Docs & Site Config Policy

Every feature shipped must keep these files current. They must always reflect the
actual product — not placeholder or template content.

| File | What it must contain |
|---|---|
| `src/config/site.ts` | Project name, description, feature list, nav config. SINGLE SOURCE of truth for all product copy used across the app. |
| `README.md` | Up-to-date feature list, tech stack, setup instructions, usage notes for any non-obvious workflows. |
| `src/app/about/page.tsx` | Accurate product description in benefit-focused, non-technical language. |
| `src/app/privacy/page.tsx` | Current data collection, retention, and sharing practices. Updated whenever a new data type is stored. |
| `src/app/terms/page.tsx` | Current usage limits, plan-gated access rules, and user obligations. Updated whenever plan gates or limits change. |

Rules:
- All copy in `/about`, `/privacy`, `/terms`, and `README.md` uses the product name
  and language from `src/config/site.ts` — never hardcode a different name.
- When a feature introduces a new user-visible capability: update `siteConfig` features,
  `README.md` features section, and `/about`.
- When a feature stores new user data: update `/privacy`.
- When a feature changes plan limits or obligations: update `/terms`.
- Make targeted additions — do not rewrite sections that are still accurate.
- If `/about`, `/privacy`, or `/terms` does not exist: note this in the handoff summary
  and create the page rather than silently skipping.

---

## 11. Commands

| Command               | What it does                                    |
| --------------------- | ----------------------------------------------- |
| `npm dev`             | Start dev server                                |
| `npm build`           | Generate Prisma client and build for production |
| `npm start`           | Start production server                         |
| `npm lint`            | Run ESLint                                      |
| `npm prisma:generate` | Generate Prisma client                          |
| `npm install`         | Install dependencies                            |
| `npm vercel-build`    | Build for Vercel                                |
| `npm db:format`       | Run Prisma format                               |
| `npm db:migrate`      | Run Prisma migrations                           |
| `npm db:generate`     | Generate Prisma client                          |
| `npm db:studio`       | Open Prisma Studio                              |
| `npm db:reset`        | Reset local DB (DESTRUCTIVE — local only)       |

---

## 12. What Agents Must Never Do

### Auth & Security
- Never modify files in `@/components/ui/` — wrap them instead.
- Never instantiate `PrismaClient` outside `@/lib/prisma.ts`.
- Never instantiate Better Auth outside `@/lib/auth.ts` or `@/lib/auth-client.ts`.
- Never access `process.env` directly — import from `@/env`.
- Never use `prisma db push` in a commit or migration script.
- Never return full user rows from queries — always `select` specific fields.
- Never commit `.env.local` — update `.env.example` instead.
- Never enable `enableSessionForAPIKeys` — leaked keys must not impersonate sessions.
- Never call `auth.api.verifyApiKey()` from a Client Component — server-side only.
- Never import `src/lib/auth.ts` in a Client Component — use `src/lib/auth-client.ts`.
- Never add an `api_keys` model to `schema.prisma` — BetterAuth owns that table.

### Types
- Never define a shared type inline in `src/server/` — it belongs in `src/types/`.
- Never import from `@/server/*` in a Client Component for types — use `@/types`.
- Never hand-write Prisma payload types — always derive with `Prisma.XxxGetPayload<>`.
- Never use bare `string` as a Server Action error type — use string literal unions.
- Never omit `export *` for a new domain type file from `src/types/index.ts`.

### Middleware & Auth Logic
- Never write ad-hoc auth or authz logic inline in route handlers or Server Actions.
  Always use or extend helpers in `src/lib/middleware.ts`.
- Never gate a feature on the client side only — always enforce server-side first.

### Patterns
- Never add `"use client"` to a file that only needs data, not interactivity.
- Never use `useEffect` for data fetching — use Server Components or React Query.
- Never run concurrent Prisma migrations — one migration at a time.
- Never create an API route as a substitute for a Server Action for form mutations.
- Never build a UI component before the Server Action or query function it calls exists.
- Never call `useStore.getState()` inside a React component — use the hook selector.

### Docs
- Never ship a feature without updating `src/config/site.ts` and `README.md`.
- Never hardcode the product name or description anywhere — always use `siteConfig`.
- Never leave `/about`, `/privacy`, or `/terms` with placeholder or stale content
  after a feature that affects them has shipped.