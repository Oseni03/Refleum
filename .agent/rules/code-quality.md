# Code Quality Rule

This is a solo-founder codebase. That means no one else will catch a bad pattern
before it spreads across 20 files. These rules exist to keep the codebase maintainable
when you return to it three months later.

---

## 1. TypeScript Strictness

- `strict: true` is always on. Never disable it, not even temporarily.
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining why it's unavoidable
  and a TODO to remove it.
- No implicit `any`. If you genuinely don't know the type, use `unknown` and narrow it.
- Prefer `type` over `interface` for object shapes — use `interface` only when you need
  declaration merging (rare).
- Always type function return values explicitly — do not rely on inference for public functions.

```ts
// ✅ Explicit return type
async function getUser(id: string): Promise<Result<User>> { ... }

// ❌ Inferred — fragile, hard to read
async function getUser(id: string) { ... }
```

---

## 2. Naming Conventions

| Thing                        | Convention          | Example                        |
|------------------------------|---------------------|--------------------------------|
| Files (components)           | PascalCase          | `ProjectCard.tsx`              |
| Files (utils, services)      | camelCase           | `projectService.ts`            |
| Files (routes)               | lowercase           | `route.ts`, `page.tsx`         |
| React components             | PascalCase          | `ProjectCard`                  |
| Variables, functions         | camelCase           | `getUserById`, `projectCount`  |
| Constants                    | SCREAMING_SNAKE     | `MAX_PROJECTS_FREE = 3`        |
| Types and interfaces         | PascalCase          | `CreateProjectInput`           |
| Zod schemas                  | PascalCase + Schema | `CreateProjectSchema`          |
| Database models (Prisma)     | PascalCase (schema), camelCase (client) | `User`, `OrgMember` → `prisma.user`, `prisma.orgMember` |
| Env variables                | SCREAMING_SNAKE     | `DATABASE_URL`                 |

- Boolean variables and functions start with `is`, `has`, `can`, or `should`:
  `isActive`, `hasAccess`, `canDelete`, `shouldNotify`
- Event handlers are prefixed with `handle`: `handleSubmit`, `handleDelete`
- Async functions are NOT prefixed with `async` — the return type conveys that

---

## 3. Function Size & Responsibility

- A function does ONE thing. If you need "and" to describe it, split it.
- Maximum ~40 lines per function. If it's longer, extract a helper.
- Service functions orchestrate — they call helpers, they don't contain complex logic inline.
- Route handlers are thin: auth check → parse → call service → return response. That's it.

---

## 4. Comments & Documentation

- Every exported function, type, and constant in `/lib/` gets a JSDoc comment.
- Comments explain WHY, not WHAT. The code shows what. Comments explain the non-obvious reason.
- Inline comments are for surprising decisions or workarounds — not for obvious code.
- TODO comments must include a date and ticket/issue reference: `// TODO(2026-04): Remove after Polar SDK v3 migration`

```ts
// ✅ Good comment — explains non-obvious reason
// Polar requires the raw body as text for signature verification.
// Do not call req.json() before this point.
const body = await req.text();

// ❌ Bad comment — just restates the code
// Get the body
const body = await req.text();
```

---

## 5. Error Handling

- Services return `Result<T, E>` — they do NOT throw across layer boundaries.
- `try/catch` lives in the service layer, not in route handlers.
- Every `catch` block logs the error with context (function name + relevant IDs) before returning.
- Never swallow errors silently — a `catch` that doesn't log or return an error is a bug.
- Error codes are SCREAMING_SNAKE strings: `"DB_ERROR"`, `"PLAN_REQUIRED"`, `"INVALID_INPUT"`.

```ts
// ✅ Correct error handling in service
export async function deleteProject(id: string, orgId: string): Promise<Result<void>> {
  try {
    await prisma.project.delete({
      where: { id, organizationId: orgId },
    });
    return { success: true, data: undefined };
  } catch (err) {
    console.error(`[projectService.deleteProject] id=${id} orgId=${orgId}`, err);
    return { success: false, error: { code: "DB_ERROR", message: "Failed to delete project" } };
  }
}
```

---

## 6. React Component Rules

- Functional components only — no class components.
- One component per file — no multiple exports from a single component file (except for sub-components via a namespace pattern).
- Props interfaces are defined directly above the component, not in a separate types file.
- Server Components are the default — only add `"use client"` when required for interactivity or browser APIs.
- Never use `useEffect` to fetch data that could be fetched in a Server Component.
- `key` props in lists always use a stable, unique identifier — never array index.

```tsx
// ✅ Correct
interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) { ... }

// ❌ Never use index as key
{projects.map((p, i) => <ProjectCard key={i} project={p} />)}
```

---

## 7. Imports & Dependencies

- Imports are grouped and ordered: (1) Node built-ins, (2) external packages, (3) internal `@/` aliases, (4) relative imports. Blank line between each group.
- Use `@/` path aliases — never deep relative imports like `../../../lib/something`.
- Never import from a barrel (`index.ts`) if the import creates a circular dependency.
- Before adding a new package, check: Is this in the existing stack? Can Prisma, Zod, or the Vercel AI SDK do this?

```ts
// ✅ Correct import order
import { randomUUID } from "crypto";

import { z } from "zod";

import { prisma } from "@/lib/db";

import { buildSlug } from "./utils";
```

---

## 8. Testing Standards

- Every service function has at least one test: the happy path and the most critical failure path.
- Every API route has integration tests for: unauthenticated (401), valid input (200), invalid input (400).
- Tests live in `__tests__/` directories adjacent to the code they test, not in a global `/tests/` folder.
- Test file names mirror the source file: `projectService.ts` → `__tests__/projectService.test.ts`.
- Mock the DB and external services (Polar, Resend, AI) in tests — never hit real APIs in unit tests.
- Test descriptions use plain English that a non-engineer could understand:
  `"returns 401 when session is missing"` not `"auth test 1"`.

---

## 9. Avoid These Patterns

| Pattern                                 | Why                                          | Instead                              |
|-----------------------------------------|----------------------------------------------|--------------------------------------|
| `as unknown as T`                       | Bypasses type safety                         | Narrow with type guards              |
| `// eslint-disable-next-line`           | Hides real problems                          | Fix the root cause                   |
| `fetch` directly in Server Components  | Bypasses service layer                       | Call service functions               |
| Nested ternaries                        | Unreadable                                   | Use early returns or if/else         |
| `setTimeout` for timing hacks           | Fragile                                      | Use proper async/await or events     |
| `console.log` left in production code  | Noise + potential data leak                  | Remove or use structured logger      |
| `Object.keys()` on typed records       | Loses type info                              | Use typed entries helpers            |
| Boolean prop without value             | Implicit `true` is confusing                 | Always be explicit: `open={true}`    |

---

## 10. Before Marking Any Task Done

Run this checklist mentally before considering a task complete:

- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] ESLint passes with no warnings (`npm run lint`)
- [ ] All new service functions have JSDoc comments
- [ ] All new API routes validate input with Zod
- [ ] All new API routes check session or API key
- [ ] No `console.log` with sensitive data left in
- [ ] No hardcoded strings that should be constants or env vars
- [ ] Tests cover the happy path and the primary failure path
