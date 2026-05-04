"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useNotificationStore } from "@/zustand/providers/notification-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
    const { notifications, isLoading, deleteNotification } = useNotificationStore((state) => state);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col gap-4">
                        <Skeleton className="w-full h-20 rounded-2xl" />
                        <Skeleton className="w-full h-20 rounded-2xl" />
                        <Skeleton className="w-full h-20 rounded-2xl" />
                        <Skeleton className="w-full h-20 rounded-2xl" />
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className="flex gap-4 bg-card border border-border p-6 rounded-2xl hover:border-primary/30 transition-all group"
                        >
                            <div className="mt-1">
                                <div
                                    className={`size-3 rounded-full ${notif.type === "SUCCESS"
                                        ? "bg-green-500"
                                        : notif.type === "ERROR"
                                            ? "bg-red-500"
                                            : notif.type === "WARNING"
                                                ? "bg-yellow-500"
                                                : "bg-blue-500"
                                        }`}
                                />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{notif.title}</p>
                                        <p className="text-muted-foreground mt-1">{notif.message}</p>
                                    </div>
                                    {!notif.read && (
                                        <Badge variant="secondary" className="text-xs">New</Badge>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{notif.createdAt.toLocaleDateString()}</span>
                                    {notif.link && (
                                        <a href={notif.link} className="text-primary hover:underline">
                                            View →
                                        </a>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotification(notif.id)}
                                className="opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))
                )}
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className="flex gap-4 bg-card border border-border p-6 rounded-2xl hover:border-primary/30 transition-all group"
                    >
                        <div className="mt-1">
                            <div
                                className={`size-3 rounded-full ${notif.type === "SUCCESS"
                                    ? "bg-green-500"
                                    : notif.type === "ERROR"
                                        ? "bg-red-500"
                                        : notif.type === "WARNING"
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                    }`}
                            />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium">{notif.title}</p>
                                    <p className="text-muted-foreground mt-1">{notif.message}</p>
                                </div>
                                {!notif.read && (
                                    <Badge variant="secondary" className="text-xs">New</Badge>
                                )}
                            </div>

                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                                {notif.link && (
                                    <a href={notif.link} className="text-primary hover:underline">
                                        View →
                                    </a>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notif.id)}
                            className="opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                ))}

                {notifications.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                        No notifications yet.
                    </p>
                )}
            </div>
        </div>
    );
}