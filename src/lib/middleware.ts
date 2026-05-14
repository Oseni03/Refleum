import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { Session, User } from "better-auth";
import { getSession } from "./auth-utils";
import { getSubscriptionPlan } from "@/server/subscription";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface AuthUser extends User {
    role?: string;
    organizationId: string;
}

export async function withAuth(
    request: NextRequest,
    handler: (
        request: NextRequest,
        user: AuthUser,
        session: Session,
    ) => Promise<NextResponse>,
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized - Please login" },
                { status: 401 },
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                members: {
                    include: {
                        organization: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        const activeOrgId = session.activeOrganizationId;
        const activeMembership =
            user.members.find((m) => m.organizationId === activeOrgId) ||
            user.members[0];

        if (!activeMembership) {
            return NextResponse.json(
                { error: "No organization membership found" },
                { status: 403 },
            );
        }

        const userContext = {
            ...session.user,
            organizationId: activeOrgId || activeMembership.organizationId,
            role: activeMembership.role,
        };

        return await handler(request, userContext, session.session);
    } catch (error) {
        console.error("Auth middleware error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 401 },
        );
    }
}

export async function withAdminAuth(
    request: NextRequest,
    handler: (
        request: NextRequest,
        user: AuthUser,
        session: Session,
    ) => Promise<NextResponse>,
) {
    return withAuth(request, async (request, user, session) => {
        if (user.role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 },
            );
        }
        return await handler(request, user, session);
    });
}

export type ApiKeyAuthResult =
    | { valid: true; organizationId: string; error: null }
    | { valid: false; organizationId: null; error: "MISSING_KEY" | "INVALID_KEY" };

export type SessionAuthResult =
    | { session: Awaited<ReturnType<typeof getSession>>; error: null }
    | { session: null; error: "UNAUTHORIZED" };

export type PlanResult =
    | { allowed: true; error: null }
    | { allowed: false; error: "PLAN_REQUIRED" };

export type OwnerResult =
    | { owned: true; error: null }
    | { owned: false; error: "NOT_FOUND" };

// ─── requireApiKey ─────────────────────────────────────────────────────────────

export async function requireApiKey(req: NextRequest): Promise<ApiKeyAuthResult> {
    const rawKey =
        req.headers.get("x-api-key") ??
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ??
        null;

    if (!rawKey) return { valid: false, organizationId: null, error: "MISSING_KEY" };

    const result = await auth.api.verifyApiKey({ body: { key: rawKey } });

    // The referenceId attached to the API key represents the organization ID
    if (!result.valid || !result.key?.referenceId) {
        return { valid: false, organizationId: null, error: "INVALID_KEY" };
    }

    return { valid: true, organizationId: result.key.referenceId, error: null };
}

// ─── requireSession ────────────────────────────────────────────────────────────

export async function requireSession(): Promise<SessionAuthResult> {
    const session = await getSession()
    if (!session || !session.user.id) return { session: null, error: "UNAUTHORIZED" };
    return { session, error: null };
}

// ─── requirePlan ───────────────────────────────────────────────────────────────

const PLAN_HIERARCHY = {
    FREE: 0,
    STARTER: 1,
    PRO: 2,
    ENTERPRISE: 3,
};

export async function requirePlan(
    orgId: string,
    requiredPlan: keyof typeof PLAN_HIERARCHY
): Promise<PlanResult> {
    const currentPlan = await getSubscriptionPlan(orgId);

    const currentLevel = PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;

    if (currentLevel < requiredLevel) {
        return { allowed: false, error: "PLAN_REQUIRED" };
    }

    return { allowed: true, error: null };
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const PLAN_RATE_LIMITS: Record<string, { requests: number; window: string }> = {
    FREE: { requests: 1, window: "1 m" },
    STARTER: { requests: 20, window: "1 m" },
    PRO: { requests: 60, window: "1 m" },
    ENTERPRISE: { requests: 1000, window: "1 m" },
};

// Cache limiters by plan to avoid re-creating on every request
const _limiters: Map<string, Ratelimit> = new Map();

function getLimiter(plan: string): Ratelimit {
    const key = plan.toUpperCase();
    if (!_limiters.has(key)) {
        const cfg = PLAN_RATE_LIMITS[key] ?? PLAN_RATE_LIMITS.FREE!;
        _limiters.set(
            key,
            new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window as Parameters<typeof Ratelimit.slidingWindow>[1]),
                analytics: true,
            })
        );
    }
    return _limiters.get(key)!;
}

export async function requireRateLimit(
    orgId: string,
    plan: string
): Promise<{ allowed: boolean; limit: number; remaining: number; reset: number; error: "RATE_LIMITED" | null }> {
    const limiter = getLimiter(plan);
    const result = await limiter.limit(`org:${orgId}`);
    return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        error: result.success ? null : "RATE_LIMITED",
    };
}

export async function requireResourceOwner(
    organizationId: string,
    resumeId: string
): Promise<OwnerResult> {
    const exists = await prisma.resume.findFirst({
        where: { id: resumeId, organizationId },
        select: { id: true },
    });
    if (!exists) return { owned: false, error: "NOT_FOUND" };
    return { owned: true, error: null };
}