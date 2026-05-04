# Security Rule

You are building a production SaaS. Security failures ship silently and hurt real users.
Apply every rule below on every task, every file, every time — no exceptions.

---

## 1. Secrets & Environment Variables

- NEVER hardcode API keys, secrets, tokens, passwords, or connection strings in source files.
- NEVER log secrets, tokens, or raw passwords — not even in development comments.
- ALL secrets are accessed via `process.env.VARIABLE_NAME` only.
- Every required env var must be declared in `.env.example` with a placeholder value and a comment explaining what it is.
- If a secret is accidentally committed, treat it as compromised immediately — flag it for rotation before doing anything else.
- The following are always secrets and must never appear in source: `DATABASE_URL`, `POLAR_WEBHOOK_SECRET`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, any `*_SECRET` or `*_KEY` variable.

```ts
// ✅ Correct
const secret = process.env.POLAR_WEBHOOK_SECRET!;

// ❌ Never do this
const secret = "whsec_abc123xyz";
```

---

## 2. API Route Authentication

Every route under `/app/api/` (except explicitly public ones) MUST validate the session BEFORE executing any logic.

- Use the shared `getSession()` helper from `/lib/auth/session.ts` — never roll your own session check inline.
- If session is missing or invalid, return `401` immediately — do not fall through.
- Public routes (webhooks, public API v1) use their own auth mechanism — they are NOT exempt from authentication, they just use a different method (see sections 4 and 5).

```ts
// ✅ Correct pattern for every protected route
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // business logic here
}

// ❌ Never do this — no session check
export async function GET(req: Request) {
  const data = await db.query.users.findMany(); // exposed to anyone
  return NextResponse.json(data);
}
```

---

## 3. Tenant Data Isolation

Every database query against a tenant-owned table MUST be scoped to the current user's `organization_id` or `user_id`.

- Never query a tenant table without a `.where()` clause that includes the tenant identifier.
- Always derive the tenant ID from the validated session — NEVER from query params, request body, or headers.
- Never trust client-supplied `organizationId` values. A user could send any org ID. The session is the source of truth.

```ts
// ✅ Correct — tenant ID from session only
const session = await getSession();
const records = await prisma.project.findMany({
  where: { organizationId: session.organizationId },
});

// ❌ Never do this — attacker can pass any orgId
const { organizationId } = await req.json();
const records = await prisma.project.findMany({
  where: { organizationId }, // user-supplied — never trust this
});
```

---

## 4. Webhook Verification (Polar.sh)

Every Polar.sh webhook MUST be cryptographically verified before processing payload data.

- Use `Webhooks.constructEvent(payload, headers, secret)` from the Polar SDK at the very top of the handler.
- If verification fails, return `400` immediately and log the failure — do not process.
- The raw request body must be read as text/buffer for signature verification — do not parse JSON first.
- Store processed webhook event IDs in `processed_webhook_events` table and check before handling to ensure idempotency.

```ts
// ✅ Correct Polar webhook verification
export async function POST(req: Request) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event: WebhookEvent;
  try {
    event = webhooks.constructEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Check idempotency
  const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
    where: { eventId: event.webhookId },
  });
  if (alreadyProcessed) return NextResponse.json({ received: true });

  // Process event...
}
```

---

## 5. Public API Key Authentication

Every route under `/app/api/v1/` MUST verify a Bearer API key before executing.

- Extract key from `Authorization: Bearer <key>` header.
- Hash the incoming key and compare against the `api_keys` table — never store or compare raw keys.
- If the key is missing, malformed, or not found, return `401` immediately.
- Log all API key usage regardless of outcome.

```ts
// ✅ Correct API key verification
const authHeader = req.headers.get("authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return NextResponse.json({ error: "Missing API key" }, { status: 401 });
}
const rawKey = authHeader.slice(7);
const hashedKey = hashApiKey(rawKey); // use /lib/api-keys/hash.ts
const keyRecord = await prisma.apiKey.findFirst({
  where: { keyHash: hashedKey, revokedAt: null },
});
if (!keyRecord) {
  return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
}
```

---

## 6. Input Validation

- ALL external input (request body, query params, headers from users) MUST be validated with a Zod schema before use.
- Validation happens at the route level, before passing data to the service layer.
- On validation failure, return `400` with the Zod error details — never let invalid data reach the DB.
- Never use `as unknown as T` to bypass type checking on external data.

```ts
// ✅ Correct
const body = await req.json();
const parsed = CreateProjectSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
await projectService.create(parsed.data);
```

---

## 7. SQL Injection Prevention

- NEVER use string interpolation or template literals to build raw SQL queries.
- ALWAYS use Prisma's parameterized query methods — `findMany`, `findFirst`, `create`, `update`, `delete`, etc.
- If a raw SQL query is absolutely necessary, use Prisma's `$queryRaw` tagged template — never plain string concatenation via `$queryRawUnsafe`.

```ts
// ✅ Correct — parameterized via Prisma
await prisma.user.findFirst({ where: { email } });

// ✅ Correct raw SQL if unavoidable — parameterized
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ❌ Never do this
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## 8. Error Response Discipline

- NEVER expose internal error messages, stack traces, or DB errors to the client.
- Log the full error server-side; return a generic, safe message to the client.
- Use consistent error shape: `{ error: { code: string, message: string } }`.

```ts
// ✅ Correct
try {
  await someService.doThing();
} catch (err) {
  console.error("[api/thing] Internal error:", err);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, { status: 500 });
}

// ❌ Never do this — leaks internals
return NextResponse.json({ error: err.message }, { status: 500 });
```

---

## 9. Rate Limiting on Sensitive Endpoints

The following endpoint categories MUST have rate limiting applied:

- All `/app/api/ai/` routes — per user, sliding window
- All `/app/api/v1/` routes — per API key, sliding window
- Auth endpoints (login, signup, password reset) — per IP

Rate limit response must be `429` with a `Retry-After` header.

---

## 10. HTTPS & Headers

- Never disable HTTPS in any environment configuration.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) must be set in `next.config.ts` headers config — do not rely on defaults.
