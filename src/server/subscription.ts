"use server";

import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";
import { Polar } from "@polar-sh/sdk";

// Assume polar logic can use a shared client
const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox",
});

export async function createFreeSubscription(organizationId: string) {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

    await prisma.subscription.create({
        data: {
            organizationId,
            plan: "FREE",
            status: "active",
            currentPeriodEnd,
        },
    });
}

export async function getSubscriptionPlan(organizationId: string): Promise<Plan> {
    const sub = await prisma.subscription.findUnique({
        where: { organizationId },
        select: { plan: true },
    });
    return sub?.plan || "FREE";
}

export async function getSubscriptionDetails(organizationId: string) {
    const sub = await prisma.subscription.findUnique({
        where: { organizationId },
    });
    return sub;
}

export async function recordUsage(
    organizationId: string,
    operation: "tailor" | "parse" | "pdf_export",
    resumeId?: string
) {
    const record = await prisma.usageRecord.create({
        data: {
            organizationId,
            operation,
            resumeId,
        },
    });

    // Fire off to Polar for metered billing if they have a customer ID
    void reportUsageToPolar(organizationId, operation, record.id).catch(console.error);

    return record;
}

export async function getUsageHistory(organizationId: string) {
    const history = await prisma.usageRecord.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
    });
    return history;
}

async function reportUsageToPolar(organizationId: string, operation: string, recordId: string) {
    const sub = await prisma.subscription.findUnique({
        where: { organizationId },
        select: { polarCustomerId: true },
    });

    if (!sub?.polarCustomerId) return;

    // TODO: implement Polar meter event push if configured.
}
