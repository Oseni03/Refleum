// Public endpoint — no auth required.
// Useful for uptime monitors and deployment smoke tests.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 * Returns: 200 { data: { status, db } }  or  503 { error: "INTERNAL_ERROR", detail }
 */
export async function GET() {
    try {
        // Lightweight DB probe — confirms the connection pool is live
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ data: { status: "ok", db: "ok" } }, { status: 200 });
    } catch (e) {
        return NextResponse.json(
            { error: "INTERNAL_ERROR", detail: "Database unreachable" },
            { status: 503 }
        );
    }
}