# Git Discipline Rule

You are a solo founder. Git is not bureaucracy — it's your undo button, your audit log,
and your deployment gate. Follow these rules so you can always roll back, bisect a bug,
and understand why a change was made six months from now.

---

## 1. Never Work Directly on `main`

- `main` is always deployable. It represents production.
- Every piece of work — feature, fix, refactor, chore — happens on its own branch.
- If you need to make an emergency hotfix, still branch from `main`, fix, and merge back.
- Direct pushes to `main` are always wrong, even for "tiny" changes.

---

## 2. Branch Naming

Use the format: `<type>/<short-description>`

| Type       | When to use                                         |
|------------|-----------------------------------------------------|
| `feat/`    | New feature or user-facing addition                 |
| `fix/`     | Bug fix                                             |
| `refactor/`| Code restructuring with no behavior change         |
| `chore/`   | Dependencies, config, tooling, non-code changes     |
| `docs/`    | Documentation only                                  |
| `test/`    | Adding or fixing tests only                         |

Branch names are lowercase, words separated by hyphens:

```bash
# ✅ Correct
feat/polar-webhook-subscription-canceled
fix/tenant-query-missing-org-filter
refactor/project-service-result-type
chore/upgrade-drizzle-0.31

# ❌ Incorrect
my-new-feature
Fix_Bug
HOTFIX
```

---

## 3. Commit Messages

All commits follow the Conventional Commits format:

```
<type>(<scope>): <short summary in imperative mood>

[optional body explaining WHY, not WHAT]

[optional footer: Breaking Change / Closes #issue]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code change, no behavior change
- `test` — adding or updating tests
- `chore` — tooling, dependencies, config
- `docs` — documentation
- `perf` — performance improvement

**Rules:**
- Summary is imperative mood: `add`, `fix`, `remove`, `update` — not `added`, `fixes`, `removing`
- Summary is max 72 characters
- Summary does not end with a period
- Body explains the reasoning — what problem does this solve? Why this approach?
- If a commit closes a bug or implements a specific requirement, note it in the footer

```bash
# ✅ Correct
feat(billing): add Polar subscription.canceled webhook handler

Revokes user access immediately on cancellation rather than waiting for
period end. Polar's SDK doesn't send a grace period event, so we handle
downgrade at the canceled event.

Closes #42

# ✅ Correct minimal commit
fix(auth): scope getSession to server-only import

# ❌ Incorrect
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "asdfgh"
git commit -m "Added the new feature for billing with Polar"
```

---

## 4. Commit Granularity

- One logical change per commit. If you changed three unrelated things, make three commits.
- Never commit commented-out code, `console.log` debugging statements, or `.env` files.
- Never commit with TypeScript errors or lint failures — run checks before committing.
- A commit should leave the codebase in a working state — not broken mid-feature.

**What counts as one logical change:**
- Adding a single service function + its test
- Adding a single API route + its Zod schema
- A single database migration
- Updating a single dependency

---

## 5. Pre-Commit Checklist

Before every `git commit`, verify:

```bash
npm run typecheck   # Must pass with zero errors
npm run lint        # Must pass with zero errors (warnings OK if pre-existing)
```

If either fails, fix it before committing. Do not commit with `--no-verify`.

---

## 6. When to Push & Open a PR

- Push your branch early and often — at least at end of each work session.
- Open a PR (even as draft) when the feature is functionally complete, before final testing.
- PR title mirrors the branch: `feat(billing): add Polar subscription.canceled handler`
- PR description contains:
  1. What this PR does (1–3 sentences)
  2. How to test it manually
  3. Any migrations that need to run
  4. Any env vars that need to be added

---

## 7. Merging

- Squash-merge feature branches into `main` to keep history clean.
- The squash commit message follows the same Conventional Commits format.
- Delete the feature branch after merging.
- Never merge a PR that has TypeScript errors, failing tests, or unresolved lint errors.

---

## 8. Database Migrations in Git

- Migration files are ALWAYS committed with the code that requires them.
- Never ship code that depends on a schema change before the migration is committed.
- Migration files are never edited after they've been merged to `main`.
  If a migration has a mistake, write a new migration to fix it — never mutate history.

---

## 9. Environment Files

```bash
# ✅ Commit this — template for others (and future you)
.env.example

# ❌ Never commit these
.env
.env.local
.env.production
.env.staging
```

`.env*` (except `.env.example`) must be in `.gitignore`. If they aren't already, add them
before doing anything else.

---

## 10. What Good Git History Looks Like

After a feature is complete, `git log --oneline` for that work should read like a story:

```
feat(billing): add Polar subscription plan enforcement middleware
feat(billing): add subscription.updated webhook handler
feat(billing): add subscription.created webhook handler
feat(billing): add Polar checkout session creation
feat(billing): add polar_subscriptions table migration
chore(billing): install @polar-sh/sdk
```

Anyone reading this (including future you) can understand what was built, in what order,
and revert any single step independently.
