import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '@/server/notifications';

type Notification = {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    read: boolean;
    link?: string | null;
    createdAt: Date;
};

export type NotificationState = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

type NotificationActions = {
    fetchNotifications: (limit?: number) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    addNotification: (notification: Notification) => void; // For future real-time
    hydrate: (initialState: NotificationState) => void;
}

export type NotificationStore = NotificationState & NotificationActions;

const defaultState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

export const createNotificationStore = (
    initialState: NotificationState = defaultState
) =>
    create<NotificationStore>()(
        devtools((set, get) => {
            return {
                ...initialState,

                fetchNotifications: async (limit?: number) => {
                    try {
                        set({ isLoading: true, error: null });
                        const data = await getNotifications(limit);
                        const unreadCount = data.filter((n) => !n.read).length;
                        set({ notifications: data, unreadCount, isLoading: false });
                    } catch (error) {
                        console.error('Error fetching notifications:', error);
                        set({ error: error instanceof Error ? error.message : 'Failed to fetch notifications', isLoading: false });
                    }
                },
                markAsRead: async (id: string) => {
                    try {
                        await markAsRead(id);
                        const { notifications } = get();
                        const updatedNotifications = notifications.map((n) =>
                            n.id === id ? { ...n, read: true } : n
                        );
                        const unreadCount = updatedNotifications.filter((n) => !n.read).length;
                        set({ notifications: updatedNotifications, unreadCount });
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                },
                markAllAsRead: async () => {
                    try {
                        await markAllAsRead();
                        const { notifications } = get();
                        const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
                        set({ notifications: updatedNotifications, unreadCount: 0 });
                    } catch (error) {
                        console.error('Error marking all notifications as read:', error);
                    }
                },
                deleteNotification: async (id: string) => {
                    try {
                        await deleteNotification(id);
                        const { notifications } = get();
                        const updatedNotifications = notifications.filter((n) => n.id !== id);
                        const unreadCount = updatedNotifications.filter((n) => !n.read).length;
                        set({ notifications: updatedNotifications, unreadCount });
                    } catch (error) {
                        console.error('Error deleting notification:', error);
                    }
                },
                addNotification: (notification: Notification) => {
                    const { notifications } = get();
                    set({
                        notifications: [notification, ...notifications],
                        unreadCount: get().unreadCount + 1,
                    });
                },

                hydrate: (initialState: NotificationState) => {
                    const { notifications, unreadCount, isLoading, error } = initialState;
                    set({ notifications, unreadCount, isLoading, error });
                },
            }
        })
    )