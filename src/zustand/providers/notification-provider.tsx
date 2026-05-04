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
    type NotificationStore,
    createNotificationStore,
} from "@/zustand/stores/notification-store";

export type NotificationStoreApi = ReturnType<typeof createNotificationStore>;

export const NotificationStoreContext = createContext<
    NotificationStoreApi | undefined
>(undefined);

export interface NotificationStoreProviderProps {
    children: ReactNode;
}

export const NotificationStoreProvider = ({
    children,
}: NotificationStoreProviderProps) => {
    const storeRef = useRef<NotificationStoreApi | null>(null);

    if (!storeRef.current) {
        storeRef.current = createNotificationStore();
    }

    // Auto-fetch notifications on mount (once per provider)
    useEffect(() => {
        const store = storeRef.current;
        if (store) {
            store.getState().fetchNotifications(8); // or 20, depending on dropdown needs
        }
    }, []);

    return (
        <NotificationStoreContext.Provider value={storeRef.current}>
            {children}
        </NotificationStoreContext.Provider>
    );
};

// Custom hook with error handling
export const useNotificationStore = <T,>(
    selector: (store: NotificationStore) => T,
): T => {
    const notificationStoreContext = useContext(NotificationStoreContext);

    if (!notificationStoreContext) {
        throw new Error(
            `useNotificationStore must be used within NotificationStoreProvider`,
        );
    }

    return useStore(notificationStoreContext, selector);
};
