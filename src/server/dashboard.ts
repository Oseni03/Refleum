"use server";

import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

// ─────────────────────────────────────────────────────────
// Stats block: counts + period-over-period growth
// ─────────────────────────────────────────────────────────
export async function getDashboardStats(organizationId: string) {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const [
        totalResumes,
        tailoredResumes,
        usageCurrent,
        usagePrevious,
        subscription,
    ] = await Promise.all([
        prisma.resume.count({ where: { organizationId } }),
        prisma.resume.count({ where: { organizationId, isMaster: false } }),
        prisma.usageRecord.findMany({
            where: { organizationId, createdAt: { gte: thirtyDaysAgo } },
            select: { operation: true },
        }),
        prisma.usageRecord.findMany({
            where: {
                organizationId,
                createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            },
            select: { operation: true },
        }),
        prisma.subscription.findUnique({
            where: { organizationId },
            select: { plan: true, status: true, currentPeriodEnd: true },
        }),
    ]);

    const tailorsCurrent = usageCurrent.filter((u) => u.operation === "tailor").length;
    const tailorsPrevious = usagePrevious.filter((u) => u.operation === "tailor").length;
    const tailorGrowth =
        tailorsPrevious === 0
            ? tailorsCurrent > 0 ? 100 : 0
            : ((tailorsCurrent - tailorsPrevious) / tailorsPrevious) * 100;

    const pdfCurrent = usageCurrent.filter((u) => u.operation === "pdf_export").length;
    const pdfPrevious = usagePrevious.filter((u) => u.operation === "pdf_export").length;
    const pdfGrowth =
        pdfPrevious === 0
            ? pdfCurrent > 0 ? 100 : 0
            : ((pdfCurrent - pdfPrevious) / pdfPrevious) * 100;

    return {
        totalResumes,
        tailoredResumes,
        tailorsThisMonth: tailorsCurrent,
        tailorGrowth: Math.round(tailorGrowth * 10) / 10,
        pdfExportsThisMonth: pdfCurrent,
        pdfGrowth: Math.round(pdfGrowth * 10) / 10,
        subscription: subscription ?? { plan: "FREE", status: "active", currentPeriodEnd: null },
    };
}

// ─────────────────────────────────────────────────────────
// 7-day usage chart: tailors vs pdf_export per day
// ─────────────────────────────────────────────────────────
export async function getDashboardChartData(organizationId: string) {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 6);

    const records = await prisma.usageRecord.findMany({
        where: {
            organizationId,
            createdAt: { gte: startOfDay(sevenDaysAgo) },
        },
        select: { operation: true, createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const dayRecords = records.filter(
            (r) => r.createdAt >= dayStart && r.createdAt <= dayEnd
        );
        return {
            date: format(date, "MMM dd"),
            tailors: dayRecords.filter((r) => r.operation === "tailor").length,
            pdfs: dayRecords.filter((r) => r.operation === "pdf_export").length,
            parses: dayRecords.filter((r) => r.operation === "parse").length,
        };
    });
}

// ─────────────────────────────────────────────────────────
// Recent resumes: master + tailored, last 5
// ─────────────────────────────────────────────────────────
export async function getRecentResumes(organizationId: string) {
    return prisma.resume.findMany({
        where: { organizationId },
        select: {
            id: true,
            filename: true,
            isMaster: true,
            status: true,
            strategy: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: { coverletters: true, outreaches: true },
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
    });
}

// ─────────────────────────────────────────────────────────
// Recent usage activity feed
// ─────────────────────────────────────────────────────────
export async function getRecentActivity(organizationId: string) {
    return prisma.usageRecord.findMany({
        where: { organizationId },
        select: {
            id: true,
            operation: true,
            resumeId: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
    });
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
export type ChartDataPoint = Awaited<ReturnType<typeof getDashboardChartData>>[number];
export type RecentResume = Awaited<ReturnType<typeof getRecentResumes>>[number];
export type ActivityRecord = Awaited<ReturnType<typeof getRecentActivity>>[number];
