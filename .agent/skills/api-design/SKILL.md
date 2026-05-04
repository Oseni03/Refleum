---

name: api-design
description: Design and implement REST APIs for Oseni's SaaS projects. Trigger when building API endpoints, routes, serializers, response shapes, pagination, error handling, rate limiting, or CORS. Covers Django DRF (preferred for Python) and Next.js API routes. Always apply consistent response envelopes, error codes, pagination format, rate limiting, and CORS policy.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# API Design

Oseni's REST API conventions. Covers Django DRF and Next.js API routes.

---

## Response Envelope (Standard Shape)

All API responses follow this shape:

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 143,
    "total_pages": 8
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required.",
    "details": { "name": ["This field is required."] }
  }
}
```

### Paginated List

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 143,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Django DRF Patterns

### Base Response Helpers

```python
# apps/core/responses.py
from rest_framework.response import Response

def success_response(data, status=200, meta=None):
    payload = {'data': data}
    if meta:
        payload['meta'] = meta
    return Response(payload, status=status)

def error_response(code: str, message: str, details=None, status=400):
    payload = {'error': {'code': code, 'message': message}}
    if details:
        payload['error']['details'] = details
    return Response(payload, status=status)

def paginated_response(serializer_data, page_obj):
    return Response({
        'data': serializer_data,
        'meta': {
            'page': page_obj.number,
            'per_page': page_obj.paginator.per_page,
            'total': page_obj.paginator.count,
            'total_pages': page_obj.paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_prev': page_obj.has_previous(),
        }
    })
```

### Pagination Class

```python
# apps/core/pagination.py
from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'per_page'
    max_page_size = 100

    def get_paginated_response(self, data):
        from rest_framework.response import Response
        return Response({
            'data': data,
            'meta': {
                'page': self.page.number,
                'per_page': self.page.paginator.per_page,
                'total': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
                'has_next': self.page.has_next(),
                'has_prev': self.page.has_previous(),
            }
        })
```

### Global Exception Handler

```python
# apps/core/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response

ERROR_CODES = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
}

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response({
            'error': {'code': 'INTERNAL_ERROR', 'message': 'An unexpected error occurred.'}
        }, status=500)

    response.data = {
        'error': {
            'code': ERROR_CODES.get(response.status_code, 'ERROR'),
            'message': str(exc),
            'details': response.data if isinstance(response.data, dict) else None,
        }
    }
    return response
```

```python
# config/settings/base.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
}
```

### Tenant-Scoped ViewSet Pattern

```python
# apps/projects/views.py
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.viewsets import TenantScopedViewSet
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(TenantScopedViewSet):
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return super().get_queryset().select_related('tenant', 'created_by')
```

### Rate Limiting (Django)

Use rate limiting on login, signup, password reset, OTP, webhook ingestion, and any public or expensive endpoint. Prefer a combination of per-IP, per-user, and per-tenant limits.

```python
# requirements: django-ratelimit
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework import viewsets

class AuthViewSet(viewsets.ViewSet):
    @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
    def create(self, request):
        ...
```

Recommended patterns:

* Authentication endpoints: `10/m` per IP
* Password reset / OTP: `5/m` per IP, `10/h` per user
* Heavy read endpoints: `60/m` per user or tenant
* Webhooks: rate limit by IP or signed source, then allow burst traffic only where needed

When blocked, return HTTP `429` with:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

### CORS (Django)

Use `django-cors-headers` and keep the allowed origins explicit. Never use wildcard origins for authenticated production APIs.

```python
# settings/base.py
INSTALLED_APPS = [
    ...,
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...,
]

CORS_ALLOWED_ORIGINS = [
    'https://app.example.com',
    'https://admin.example.com',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-tenant-id',
    'x-request-id',
]
```

For local development, allow `http://localhost:*` only in non-production settings.

### Router Setup

```python
# config/urls.py
from rest_framework.routers import DefaultRouter
from apps.projects.views import ProjectViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/', include('dj_rest_auth.urls')),
]
```

---

## Next.js API Routes

### Route Handler Pattern

```typescript
// app/api/projects/route.ts
import { auth } from "@/lib/auth"; // BetterAuth instance
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const createSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().optional(),
});

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session)
		return NextResponse.json(
			{ error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
			{ status: 401 },
		);

	const { searchParams } = new URL(req.url);
	const page = parseInt(searchParams.get("page") ?? "1");
	const perPage = parseInt(searchParams.get("per_page") ?? "20");

	const [projects, total] = await Promise.all([
		db.project.findMany({
			where: { userId: session.user.id },
			skip: (page - 1) * perPage,
			take: perPage,
			orderBy: { createdAt: "desc" },
		}),
		db.project.count({ where: { userId: session.user.id } }),
	]);

	return NextResponse.json({
		data: projects,
		meta: {
			page,
			per_page: perPage,
			total,
			total_pages: Math.ceil(total / perPage),
			has_next: page * perPage < total,
			has_prev: page > 1,
		},
	});
}

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session)
		return NextResponse.json(
			{ error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
			{ status: 401 },
		);

	const body = await req.json();
	const parsed = createSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid input",
					details: parsed.error.flatten(),
				},
			},
			{ status: 422 },
		);
	}

	const project = await db.project.create({
		data: { ...parsed.data, userId: session.user.id },
	});
	return NextResponse.json({ data: project }, { status: 201 });
}
```

### Rate Limiting (Next.js)

Apply rate limiting at the route handler level for login, signup, and public endpoints using a shared limiter backed by Redis or the edge runtime cache.

```typescript
// app/api/_lib/rate-limit.ts
export async function checkRateLimit(key: string) {
	// Implement with Redis, Upstash, or a provider-specific limiter.
	// Return { allowed: boolean, retryAfter?: number }
	return { allowed: true };
}
```

```typescript
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";

const limit = await checkRateLimit(`auth:${session?.user.id ?? ipAddress}`);
if (!limit.allowed) {
	return NextResponse.json(
		{ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
		{ status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
	);
}
```

Suggested defaults:

* Public GET endpoints: `120/m` per IP
* Auth endpoints: `10/m` per IP
* Sensitive actions: `5/m` per user
* Webhooks: signature verification first, then targeted limiting

### CORS (Next.js)

For route handlers that must support browser requests from other origins, set CORS headers explicitly. Keep allowed origins in an environment variable and mirror only approved origins.

```typescript
const allowedOrigins = ["https://app.example.com", "https://admin.example.com"];
const origin = req.headers.get("origin");
const headers = origin && allowedOrigins.includes(origin)
	? {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Tenant-Id",
		"Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
	}
	: {};
```

Handle preflight requests:

```typescript
export async function OPTIONS(req: Request) {
	const origin = req.headers.get("origin");
	if (!origin || !allowedOrigins.includes(origin)) {
		return new NextResponse(null, { status: 403 });
	}

	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Tenant-Id",
			"Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
		},
	});
}
```

Never return `Access-Control-Allow-Origin: *` when credentials are involved.

---

## URL Naming Conventions

```
GET    /api/v1/projects           → list
POST   /api/v1/projects           → create
GET    /api/v1/projects/:id       → retrieve
PATCH  /api/v1/projects/:id       → partial update
DELETE /api/v1/projects/:id      → delete (soft)

# Nested resources
GET    /api/v1/projects/:id/tasks → list tasks for project
POST   /api/v1/projects/:id/tasks → create task in project

# Actions (not CRUD)
POST   /api/v1/projects/:id/publish
POST   /api/v1/projects/:id/archive
```

---

## Rate Limiting Policy

* Protect all authentication and password reset endpoints.
* Prefer per-IP limits for anonymous traffic and per-user/per-tenant limits for authenticated traffic.
* Return `429` with `Retry-After` when the client should back off.
* Log repeated abuse attempts separately for monitoring and alerting.
* Keep limits configurable through environment variables.

## CORS Policy

* Allow only trusted frontend origins.
* Permit credentials only for authenticated browser sessions.
* Include preflight support for `OPTIONS`.
* Keep allowed headers and methods explicit.
* Use different CORS settings for local, staging, and production environments.

---

## API Versioning

* Always version under `/api/v1/`
* Introduce `/api/v2/` only for breaking changes
* Keep v1 alive for at least 6 months with deprecation warnings in response headers
