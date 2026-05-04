---
name: multi-tenancy
description: Implement multi-tenancy architecture for Oseni's SaaS apps. Trigger when the user mentions multi-tenancy, tenant isolation, workspaces, organizations, "multiple customers sharing a DB", row-level security, or designing a B2B SaaS. Next.js/Prisma projects use BetterAuth's Organization plugin — never build a custom tenant/membership model for TypeScript projects. Django projects use a custom Tenant model with TenantMiddleware. Default approach is shared-schema with organizationId/tenant_id on every row.
---

# Multi-tenancy

**Next.js/Prisma**: Use BetterAuth's Organization plugin — it handles org creation, membership, invitations, roles, and active org switching out of the box. Never build a custom tenant model for TypeScript projects.

**Django**: Use a custom `Tenant` model + `TenantMiddleware`. Django does not use BetterAuth.

---

## Tenancy Model Decision

```
Is strict data isolation required? (HIPAA, SOC2, enterprise contract)
  YES → Schema-per-tenant (rare, complex, expensive — discuss before starting)
  NO  → Shared schema with organizationId / tenant_id (default — always start here)
```

---

## Next.js + Prisma — BetterAuth Organization Plugin

### 1. Install & Configure

```bash
npm install better-auth
```

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import { db } from '@/lib/db'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 1,           // 1 org per user — increase for agency/multi-workspace
      membershipLimit: 100,
      creatorRole: 'owner',
      sendInvitationEmail: async (data) => {
        // Wire to Resend — see notifications skill
        await sendOrgInviteEmail(data.email, data.invitation)
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
```

### 2. Expose Auth Routes

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

### 3. Prisma Schema

BetterAuth's Organization plugin manages its own tables. Add them to `schema.prisma` alongside your app models:

```prisma
// ─── BetterAuth core tables (do not modify) ──────────────────────────────────
model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Billing (Polar)
  polarCustomerId     String?
  polarSubscriptionId String?
  subscriptionStatus  String  @default("free")
  plan                Plan    @default(FREE)

  sessions    Session[]
  accounts    Account[]
  members     Member[]
}

model Session {
  id                   String   @id @default(uuid())
  expiresAt            DateTime
  token                String   @unique
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  ipAddress            String?
  userAgent            String?
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activeOrganizationId String?  // ← BetterAuth sets this when user switches org
}

model Account {
  id                    String    @id @default(uuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String   @id @default(uuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─── BetterAuth Organization plugin tables (do not modify) ───────────────────
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String?  @unique
  logo      String?
  metadata  String?  // JSON string — store extra org fields here
  createdAt DateTime @default(now())

  // Billing (Polar) — add to org for B2B billing
  polarCustomerId     String?
  polarSubscriptionId String?
  subscriptionStatus  String  @default("free")
  plan                Plan    @default(FREE)

  members     Member[]
  invitations Invitation[]

  // Your app's resources scoped to this org
  projects    Project[]    // example — add all org-scoped models here
}

model Member {
  id             String       @id @default(uuid())
  organizationId String
  userId         String
  role           String       @default("member")  // owner | admin | member
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
}

model Invitation {
  id             String       @id @default(uuid())
  organizationId String
  email          String
  role           String?
  status         String       @default("pending")  // pending | accepted | rejected | canceled
  expiresAt      DateTime
  inviterId      String
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ─── App resources — always scope to organizationId ──────────────────────────
model Project {
  id             String       @id @default(uuid())
  name           String
  description    String?
  organizationId String                             // ← every app model gets this
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ─── Enums ────────────────────────────────────────────────────────────────────
enum Plan { FREE PRO TEAM ENTERPRISE }
```

### 4. Middleware — Auth + Active Org Guard

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { betterFetch } from '@better-fetch/fetch'
import type { Session } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/pricing', '/api/auth', '/api/webhooks', '/api/health']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAsset  = pathname.includes('.')
  if (isPublic || isAsset) return NextResponse.next()

  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL:  request.nextUrl.origin,
    headers:  { cookie: request.headers.get('cookie') || '' },
  })

  // No session → redirect to sign in
  if (!session) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Session exists but no active org → redirect to onboarding
  // (skip for the onboarding route itself)
  if (!session.session.activeOrganizationId && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 5. Get Active Org in Server Components & API Routes

```typescript
// src/lib/auth-helpers.ts
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

/** Returns the current session. Throws if unauthenticated. */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

/** Returns the active organization from session. Throws if none set. */
export async function requireOrganization() {
  const session = await requireSession()
  const orgId = session.session.activeOrganizationId
  if (!orgId) throw new Error('NO_ACTIVE_ORGANIZATION')

  const org = await db.organization.findUnique({ where: { id: orgId } })
  if (!org) throw new Error('ORGANIZATION_NOT_FOUND')

  return { session, org }
}

/** Returns active org member + their role. */
export async function requireOrgMember() {
  const { session, org } = await requireOrganization()
  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: session.user.id,
      },
    },
  })
  if (!member) throw new Error('NOT_A_MEMBER')
  return { session, org, member }
}
```

```typescript
// Usage in a Server Component
export default async function ProjectsPage() {
  const { org } = await requireOrganization()
  const projects = await db.project.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  return <ProjectList projects={projects} />
}

// Usage in an API route
export async function GET(req: Request) {
  try {
    const { org } = await requireOrganization()
    const projects = await db.project.findMany({
      where: { organizationId: org.id, deletedAt: null },
    })
    return Response.json({ data: projects })
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    if (e.message === 'NO_ACTIVE_ORGANIZATION') return Response.json({ error: { code: 'NO_ORG' } }, { status: 403 })
    throw e
  }
}
```

### 6. Role-Based Guards

```typescript
// src/lib/roles.ts
type Role = 'owner' | 'admin' | 'member'

const ROLE_ORDER: Role[] = ['member', 'admin', 'owner']

export function hasRole(memberRole: string, requiredRole: Role): boolean {
  return ROLE_ORDER.indexOf(memberRole as Role) >= ROLE_ORDER.indexOf(requiredRole)
}

// Usage:
// const { member } = await requireOrgMember()
// if (!hasRole(member.role, 'admin')) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })
```

### 7. Client-Side Org Context (React)

```typescript
// src/hooks/use-organization.ts
'use client'
import { useActiveOrganization, useListOrganizations } from 'better-auth/react'
import { authClient } from '@/lib/auth-client'

export function useOrg() {
  const { data: activeOrg, isPending } = useActiveOrganization()
  const { data: orgs } = useListOrganizations()
  return { activeOrg, orgs, isPending }
}
```

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [organizationClient()],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  useActiveOrganization,
  useListOrganizations,
} = authClient
```

### 8. Onboarding — Create Org After Signup

```typescript
// src/app/(auth)/onboarding/page.tsx
'use client'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { notify } from '@/lib/toast'

const schema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(50),
})

export default function OnboardingPage() {
  const router = useRouter()
  const form = useForm({ resolver: zodResolver(schema) })

  async function handleCreateOrg(values: { name: string }) {
    const slug = values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { error } = await authClient.organization.create({
      name: values.name,
      slug,
    })

    if (error) return notify.error('Could not create workspace')

    // Set as active org then go to dashboard
    await authClient.organization.setActive({ organizationSlug: slug })
    router.push('/dashboard')
  }

  return (
    <form onSubmit={form.handleSubmit(handleCreateOrg)}>
      {/* form fields */}
    </form>
  )
}
```

### 9. Invite Members

```typescript
// src/app/api/org/invite/route.ts
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const { email, role } = await req.json()

  const result = await auth.api.inviteMember({
    headers: await headers(),
    body: {
      email,
      role: role ?? 'member',
    },
  })

  if (result.error) return Response.json({ error: result.error }, { status: 400 })
  return Response.json({ data: result.data })
}
```

### 10. Scoped Queries — Always Filter by organizationId

```typescript
// Every Prisma query on an org-scoped model must include organizationId.
// Use requireOrganization() to get it — never trust client-supplied org IDs.

// ✅ Correct
const projects = await db.project.findMany({
  where: { organizationId: org.id, deletedAt: null },
})

// ❌ Wrong — trusting client input directly
const orgId = req.headers.get('x-org-id')
const projects = await db.project.findMany({ where: { organizationId: orgId } })
```

---

## Django — Custom Tenant Model

Django does not use BetterAuth. Use the custom `Tenant` model + `TenantMiddleware`.

### Tenant Model
```python
# apps/accounts/models.py
from apps.core.models import BaseModel
from django.db import models

class Tenant(BaseModel):
    name   = models.CharField(max_length=255)
    slug   = models.SlugField(unique=True)
    logo_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    # Billing (Polar)
    polar_customer_id     = models.CharField(max_length=255, blank=True)
    polar_subscription_id = models.CharField(max_length=255, blank=True)
    subscription_status   = models.CharField(
        max_length=20,
        choices=[
            ('free','Free'), ('trialing','Trialing'),
            ('active','Active'), ('past_due','Past Due'), ('cancelled','Cancelled'),
        ],
        default='free'
    )
    plan = models.CharField(
        max_length=20,
        choices=[('free','Free'),('pro','Pro'),('team','Team')],
        default='free'
    )

    def __str__(self):
        return self.name

class TenantMembership(BaseModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='memberships')
    user   = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='tenant_memberships')
    role   = models.CharField(
        max_length=20,
        choices=[('owner','Owner'),('admin','Admin'),('member','Member'),('viewer','Viewer')],
        default='member'
    )

    class Meta:
        unique_together = [['tenant', 'user']]
```

### TenantMiddleware
```python
# apps/core/middleware.py
from django.http import Http404
from apps.accounts.models import Tenant

class TenantMiddleware:
    """Resolves tenant from subdomain and injects into request."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host()
        subdomain = host.split('.')[0]

        if subdomain in ('localhost', 'www', 'admin', '127'):
            request.tenant = None
        else:
            try:
                request.tenant = Tenant.objects.get(slug=subdomain, is_active=True)
            except Tenant.DoesNotExist:
                raise Http404('Tenant not found')

        return self.get_response(request)
```

### Tenant-Scoped ViewSet
```python
# apps/core/viewsets.py
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

class TenantScopedViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        if not self.request.tenant:
            raise PermissionDenied('No tenant context.')
        return super().get_queryset().filter(
            tenant=self.request.tenant,
            deleted_at__isnull=True,
        )

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)
```

### Onboarding Flow
```python
# apps/accounts/services.py
from django.db import transaction

@transaction.atomic
def create_tenant_with_owner(user, name: str, slug: str) -> 'Tenant':
    from apps.billing.tasks import create_polar_customer
    tenant = Tenant.objects.create(name=name, slug=slug)
    TenantMembership.objects.create(tenant=tenant, user=user, role='owner')
    create_polar_customer.delay(str(tenant.id))
    return tenant
```

### Background Jobs — Always Pass tenant_id Explicitly
```python
@shared_task
def process_report(tenant_id: str, report_id: str) -> None:
    tenant = Tenant.objects.get(id=tenant_id)
    report = Report.objects.get(id=report_id, tenant=tenant)
    # ...
```

---

## PostgreSQL Row Level Security (High Security — Optional)

Use only when schema-per-tenant is required or a specific compliance contract demands it.

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

Set context per request in Django middleware or a Prisma middleware extension.