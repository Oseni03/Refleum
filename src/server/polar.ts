/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { getPlanByProductId } from "@/lib/utils";
import { Plan } from "@prisma/client";

// Helper function for safe date parsing
function safeParseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Common update logic for subscription events
 */
async function updateLocalSubscription(
    organizationId: string,
    data: {
        polarSubscriptionId?: string;
        polarCustomerId?: string;
        status: string;
        currentPeriodEnd?: Date | null;
        plan?: Plan;
    }
) {
    return await prisma.subscription.upsert({
        where: { organizationId },
        update: data,
        create: {
            organizationId,
            plan: data.plan || Plan.FREE,
            status: data.status,
            polarSubscriptionId: data.polarSubscriptionId,
            polarCustomerId: data.polarCustomerId,
            currentPeriodEnd: data.currentPeriodEnd,
        },
    });
}

export async function handleSubscriptionUpdated(payload: any) {
    const organizationId = payload.data.metadata?.referenceId;
    if (!organizationId) {
        console.error("❌ No referenceId found in metadata for subscription:", payload.data.id);
        return;
    }

    const planData = getPlanByProductId(payload.data.product?.id || "");
    const plan = planData.id;

    console.log(`🎯 Processing subscription updated: ${payload.data.id} for org: ${organizationId}`);

    try {
        await updateLocalSubscription(organizationId, {
            polarSubscriptionId: payload.data.id,
            polarCustomerId: payload.data.customerId,
            status: payload.data.status, // active, past_due, canceled, etc.
            currentPeriodEnd: safeParseDate(payload.data.currentPeriodEnd),
            plan,
        });
        console.log("✅ Updated subscription:", payload.data.id);
    } catch (error) {
        console.error("💥 Error updating subscription:", error);
    }
}

export async function handleSubscriptionCanceled(payload: any) {
    const organizationId = payload.data.metadata?.referenceId;
    if (!organizationId) return;

    console.log("🎯 Processing subscription canceled:", payload.data.id);
    try {
        await updateLocalSubscription(organizationId, {
            status: "canceled",
            currentPeriodEnd: safeParseDate(payload.data.currentPeriodEnd),
        });
        console.log("✅ Canceled subscription:", payload.data.id);
    } catch (error) {
        console.error("💥 Error canceling subscription:", error);
    }
}

export async function handleSubscriptionRevoked(payload: any) {
    const organizationId = payload.data.metadata?.referenceId;
    if (!organizationId) return;

    console.log("🎯 Processing subscription revoked:", payload.data.id);
    try {
        await updateLocalSubscription(organizationId, {
            status: "canceled",
            plan: Plan.FREE,
        });
        console.log("✅ Revoked subscription (reset to FREE):", payload.data.id);
    } catch (error) {
        console.error("💥 Error revoking subscription:", error);
    }
}

export async function handleSubscriptionUncanceled(payload: any) {
    const organizationId = payload.data.metadata?.referenceId;
    if (!organizationId) return;

    console.log("🎯 Processing subscription uncanceled:", payload.data.id);
    try {
        await updateLocalSubscription(organizationId, {
            status: payload.data.status,
            currentPeriodEnd: safeParseDate(payload.data.currentPeriodEnd),
        });
        console.log("✅ Uncanceled subscription:", payload.data.id);
    } catch (error) {
        console.error("💥 Error uncanceling subscription:", error);
    }
}

export async function handleSubscriptionActive(payload: any) {
    const organizationId = payload.data.metadata?.referenceId;
    if (!organizationId) return;

    const planData = getPlanByProductId(payload.data.product?.id || "");
    const plan = planData.id;

    console.log("🎯 Processing subscription active:", payload.data.id);
    try {
        await updateLocalSubscription(organizationId, {
            status: "active",
            currentPeriodEnd: safeParseDate(payload.data.currentPeriodEnd),
            plan,
        });
        console.log("✅ Activated subscription:", payload.data.id);
    } catch (error) {
        console.error("💥 Error activating subscription:", error);
    }
}

// Main webhook handler
export async function handleSubscriptionWebhook(payload: any) {
    const { type } = payload;
    switch (type) {
        case "subscription.created":
        case "subscription.updated":
            return handleSubscriptionUpdated(payload);
        case "subscription.canceled":
            return handleSubscriptionCanceled(payload);
        case "subscription.revoked":
            return handleSubscriptionRevoked(payload);
        case "subscription.uncanceled":
            return handleSubscriptionUncanceled(payload);
        case "subscription.active":
            return handleSubscriptionActive(payload);
        default:
            console.log(`🤷‍♂️ Unhandled subscription event: ${type}`);
    }
}
