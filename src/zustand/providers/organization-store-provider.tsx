"use client";

import {
	type ReactNode,
	createContext,
	useRef,
	useContext,
	useEffect,
} from "react";
import { useStore } from "zustand";
import {
	OrganizationState,
	type OrganizationStore,
	createOrganizationStore,
} from "@/zustand/stores/organization-store";
import { authClient } from "@/lib/auth-client";
import { Organization } from "@/types";

export type OrganizationStoreApi = ReturnType<typeof createOrganizationStore>;

export const OrganizationStoreContext = createContext<
	OrganizationStoreApi | undefined
>(undefined);

export interface OrganizationStoreProviderProps {
	children: ReactNode;
}

export const OrganizationStoreProvider = ({
	children,
}: OrganizationStoreProviderProps) => {
	// 1. Call ALL hooks unconditionally at the top level
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const { data: organizations } = authClient.useListOrganizations();
	const { data: activeRole } = authClient.useActiveMemberRole();

	const storeRef = useRef<OrganizationStoreApi | null>(null);

	// 2. Create the store only once (on the very first render)
	if (storeRef.current === null) {
		const initialOrg: OrganizationState = {
			activeOrganization:
				(activeOrganization as Organization) ||
				(organizations?.[0] as Organization),
			members: activeOrganization?.members || [],
			invitations: activeOrganization?.invitations || [],
			organizations: (organizations as Organization[]) || [],
			isAdmin: activeRole?.role == "admin",
			isLoading: false,
			error: null,
			// subscription remains undefined (optional in your type)
		};

		storeRef.current = createOrganizationStore(initialOrg);
	}

	useEffect(() => {
		if (!storeRef.current) return;
		storeRef.current.getState().hydrate({
			activeOrganization:
				(activeOrganization as Organization) ||
				(organizations?.[0] as Organization),
			members: activeOrganization?.members || [],
			invitations: activeOrganization?.invitations || [],
			organizations: (organizations as Organization[]) || [],
			subscription: (activeOrganization as Organization)?.subscription,
			isAdmin: activeRole?.role == "admin",
		});
	}, [activeRole, activeOrganization, organizations]);

	return (
		<OrganizationStoreContext.Provider value={storeRef.current}>
			{children}
		</OrganizationStoreContext.Provider>
	);
};

export const useOrganizationStore = <T,>(
	selector: (store: OrganizationStore) => T,
): T => {
	const organizationStoreContext = useContext(OrganizationStoreContext);

	if (!organizationStoreContext) {
		throw new Error(
			`useOrganizationStore must be used within OrganizationStoreProvider`,
		);
	}

	return useStore(organizationStoreContext, selector);
};
