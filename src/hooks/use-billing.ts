import { SUBSCRIPTION_PLANS } from "@/lib/utils";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Plan } from "@prisma/client";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useBilling() {
    const activeOrganization = useOrganizationStore((state) => state.activeOrganization);
    const members = useOrganizationStore((state) => state.members);
    const isAdmin = useOrganizationStore((state) => state.isAdmin);
    const subscription = useOrganizationStore((state) => state.subscription);
    const isLoading = useOrganizationStore((state) => state.isLoading);
    const error = useOrganizationStore((state) => state.error);
    const loadSubscription = useOrganizationStore((state) => state.loadSubscription);
    const subscribe = useOrganizationStore((state) => state.subscribe);
    const openPortal = useOrganizationStore((state) => state.openPortal);

    useEffect(() => {
        if (!activeOrganization?.id) return;
        loadSubscription(activeOrganization.id).catch(() => undefined);
    }, [activeOrganization?.id, loadSubscription]);

    const productIds = SUBSCRIPTION_PLANS.map((plan) => plan.productId).filter(
        Boolean,
    ) as string[];

    const handleSubscriptionAction = useCallback(async () => {
        if (!activeOrganization) {
            toast.error("No active organization selected");
            return;
        }
        if (!isAdmin) {
            toast.error("Administrator permissions required");
            return;
        }

        try {
            toast.loading("Preparing billing flow...");
            if (subscription) {
                await openPortal();
            } else {
                await subscribe(activeOrganization.id, productIds);
            }
        } catch {
            toast.dismiss();
            toast.error("Billing action failed. Please try again.");
        } finally {
            toast.dismiss();
        }
    }, [activeOrganization, isAdmin, subscription, openPortal, subscribe, productIds]);

    const handleUpgradePlan = useCallback(async () => {
        if (!activeOrganization) {
            toast.error("No active organization selected");
            return;
        }
        if (!isAdmin) {
            toast.error("Administrator permissions required");
            return;
        }

        try {
            toast.loading("Preparing checkout...");
            await subscribe(activeOrganization.id, productIds);
        } catch {
            toast.dismiss();
            toast.error("Failed to prepare checkout. Please try again.");
        } finally {
            toast.dismiss();
        }
    }, [activeOrganization, isAdmin, openPortal, subscribe, productIds]);

    const handleCancelSubscription = useCallback(async () => {
        if (!activeOrganization) {
            toast.error("No active organization selected");
            return;
        }
        if (!isAdmin) {
            toast.error("Administrator permissions required");
            return;
        }
        if (!subscription) {
            toast.error("No active subscription to cancel");
            return;
        }

        try {
            toast.loading("Opening customer portal...");
            await openPortal();
        } catch {
            toast.dismiss();
            toast.error("Failed to open billing portal. Please try again.");
        } finally {
            toast.dismiss();
        }
    }, [activeOrganization, isAdmin, subscription, openPortal]);

    const plan = subscription?.plan || Plan.FREE;

    return {
        members,
        isAdmin,
        subscription,
        isLoading,
        error,
        plan,
        handleSubscriptionAction,
        handleUpgradePlan,
        handleCancelSubscription,
    };
}