import { authClient } from "@/lib/auth-client";
import { Member, Organization } from "@/types";
import { Invitation, Subscription } from "@prisma/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrganizationState = {
    activeOrganization?: Organization;
    members: Member[];
    invitations: Invitation[];
    organizations: Organization[];
    subscription?: Subscription;
    isAdmin: boolean;
    isLoading: boolean;
    error: string | null;
};

type OrganizationActions = {
    setActiveOrganization: (organizationId: string) => Promise<void>;
    createOrganization: (
        userId: string,
        values: { name: string; slug: string },
    ) => Promise<{ success: boolean }>;
    updateOrganization: (
        organizationId: string,
        values: { name: string; slug: string },
    ) => Promise<{ success: boolean }>;
    deleteOrganization: (
        organizationId: string,
    ) => Promise<{ success: boolean }>;
    inviteMember: (
        organizationId: string,
        values: { email: string; role: "admin" | "member" },
    ) => Promise<{ success: boolean; error?: string }>;
    cancelInvitation: (invitationId: string) => Promise<{ success: boolean }>;
    updateMemberRole: (
        memberId: string,
        values: { organizationId: string; role: "admin" | "member" },
    ) => Promise<{ success: boolean }>;
    removeMember: (
        memberId: string,
        organizationId: string,
    ) => Promise<{
        success: boolean;
        error?: {
            code?: string | undefined;
            message?: string | undefined;
            status: number;
            statusText: string;
        } | null;
    }>;
    loadSubscription: (organizationId: string) => Promise<void>;
    subscribe: (organizationId: string, products: string[]) => Promise<void>;
    openPortal: () => Promise<void>;
    updateSubscription: (subscription: Subscription) => void;
    setLoading: (loading: boolean) => void;
    hydrate: (data: Partial<OrganizationState>) => void;
};

export type OrganizationStore = OrganizationState & OrganizationActions;

export const defaultInitState: OrganizationState = {
    activeOrganization: undefined,
    members: [],
    invitations: [],
    organizations: [],
    subscription: undefined,
    isAdmin: false,
    isLoading: false,
    error: null,
};

export const createOrganizationStore = (
    initState: OrganizationState = defaultInitState,
) => {
    return create<OrganizationStore>()(
        persist(
            (set, get) => ({
                ...initState,
                setLoading: (loading: boolean) => {
                    set((state) => ({ ...state, isLoading: loading }));
                },

                // Async function that handles the data fetching properly
                setActiveOrganization: async (organizationId) => {
                    // Set loading state
                    get().setLoading(true);

                    try {
                        await authClient.organization.setActive({
                            organizationId,
                        });

                        get().setLoading(false);
                    } catch (error) {
                        console.error("Error fetching organization:", error);
                        get().setLoading(false);
                    }
                },
                createOrganization: async (userId, values) => {
                    const { data } = await authClient.organization.create({
                        ...values,
                        userId,
                    });

                    if (!data) {
                        return { success: false };
                    }
                    return { success: true };
                },
                updateOrganization: async (organizationId, values) => {
                    const { data } = await authClient.organization.update({
                        organizationId,
                        data: values,
                    });

                    if (!data) {
                        return { success: false };
                    }

                    set((state) => ({
                        ...state,
                        activeOrganization: data as Organization,
                    }));
                    return { success: true };
                },
                deleteOrganization: async (organizationId) => {
                    const { data } = await authClient.organization.delete({
                        organizationId,
                    });

                    if (!data) {
                        return { success: false };
                    }

                    return { success: true };
                },
                inviteMember: async (organizationId, values) => {
                    const { error, data } =
                        await authClient.organization.inviteMember({
                            email: values.email,
                            role: values.role,
                            organizationId,
                            resend: true,
                        });

                    if (!data || error) {
                        return { success: false, error: error.message };
                    }

                    set((state) => ({
                        ...state,
                        invitations: [...state.invitations, data as Invitation],
                    }));

                    return { success: true };
                },
                cancelInvitation: async (invitationId) => {
                    const { data, error } =
                        await authClient.organization.cancelInvitation({
                            invitationId,
                        });

                    if (!data || error) {
                        return { success: false, error: error.message };
                    }

                    set((state) => ({
                        ...state,
                        invitations: state.invitations.filter(
                            (invite) => invite.id !== invitationId,
                        ),
                    }));

                    return { success: true };
                },
                updateMemberRole: async (memberId, values) => {
                    const { data, error } =
                        await authClient.organization.updateMemberRole({
                            memberId,
                            organizationId: values.organizationId,
                            role: values.role,
                        });

                    if (!data || error) {
                        return { success: false };
                    }

                    set((state) => ({
                        ...state,
                        members: state.members.map((member) =>
                            member.id === memberId
                                ? { ...member, role: values.role }
                                : member,
                        ),
                    }));

                    return { success: true };
                },
                removeMember: async (memberId, organizationId) => {
                    const { data, error } =
                        await authClient.organization.removeMember({
                            memberIdOrEmail: memberId,
                            organizationId,
                        });

                    if (!data || error) {
                        return { success: false, error };
                    }

                    set((state) => ({
                        ...state,
                        members: state.members.filter(
                            (member) => member.id !== memberId,
                        ),
                    }));

                    return { success: true };
                },
                loadSubscription: async (organizationId: string) => {
                    if (!organizationId) return;

                    set((state) => ({
                        ...state,
                        isLoading: true,
                        error: null,
                    }));

                    try {
                        const response = await fetch(
                            `/api/subscription/${organizationId}`,
                        );

                        if (!response.ok) {
                            if (response.status === 404) {
                                set((state) => ({
                                    ...state,
                                    subscription: undefined,
                                    isLoading: false,
                                }));
                                return;
                            }
                            throw new Error("Failed to fetch subscription");
                        }

                        const { data } = await response.json();
                        set((state) => ({
                            ...state,
                            subscription: data,
                            isLoading: false,
                        }));
                    } catch (error) {
                        console.error("Error loading subscription:", error);
                        set((state) => ({
                            ...state,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Failed to load subscription",
                            isLoading: false,
                        }));
                    }
                },

                subscribe: async (
                    organizationId: string,
                    products: string[],
                ) => {
                    if (!organizationId) {
                        set({ error: "Organization ID required" });
                        return;
                    }

                    set((state) => ({
                        ...state,
                        isLoading: true,
                        error: null,
                    }));

                    try {
                        const { data, error } = await authClient.checkout({
                            products,
                            referenceId: organizationId,
                        });
                        set({ isLoading: false });
                        if (error) {
                            throw new Error(error.message);
                        }
                        if (data?.url) window.location.href = data.url;
                        // Note: subscription will be updated via webhook after successful checkout
                    } catch (error) {
                        console.error("Error creating checkout:", error);
                        set((state) => ({
                            ...state,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Failed to create checkout",
                            isLoading: false,
                        }));
                        throw error;
                    }
                },

                openPortal: async () => {
                    set((state) => ({
                        ...state,
                        isLoading: true,
                        error: null,
                    }));

                    try {
                        await authClient.customer.portal();
                        set({ isLoading: false });
                    } catch (error) {
                        console.error("Error opening customer portal:", error);
                        set((state) => ({
                            ...state,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Failed to open customer portal",
                            isLoading: false,
                        }));
                        throw error;
                    }
                },

                updateSubscription: (subscription: Subscription) => {
                    set((state) => ({ ...state, subscription }));
                },
                hydrate: (data) => {
                    set((state) => ({ ...state, ...data }));
                },
            }),
            { name: "organization-store" },
        ),
    );
};
