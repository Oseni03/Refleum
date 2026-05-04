import { SUBSCRIPTION_PLANS } from "@/lib/utils";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
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

    const getPlanFromProductId = useCallback((productId: string) => {
        return SUBSCRIPTION_PLANS.find((plan) => plan.productId === productId);
    }, []);

    const currentPlan = subscription?.productId
        ? getPlanFromProductId(subscription.productId)
        : SUBSCRIPTION_PLANS.find((p) => p.id === "free");

    const planName = currentPlan?.name || "Free";

    return {
        members,
        isAdmin,
        subscription,
        isLoading,
        error,
        handleSubscriptionAction,
        currentPlan,
        planName,
    };
}