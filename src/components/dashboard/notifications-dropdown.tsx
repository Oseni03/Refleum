"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/zustand/providers/notification-provider";

export function NotificationsDropdown() {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead
    } = useNotificationStore((state) => state);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-96">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : notifications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No notifications yet
                        </p>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors",
                                    !notif.read && "bg-muted/30"
                                )}
                                onClick={() => markAsRead(notif.id)}
                            >
                                <div className="flex gap-3">
                                    <div
                                        className={cn(
                                            "mt-1 size-2 rounded-full flex-shrink-0",
                                            notif.type === "SUCCESS" && "bg-green-500",
                                            notif.type === "WARNING" && "bg-yellow-500",
                                            notif.type === "ERROR" && "bg-red-500",
                                            notif.type === "INFO" && "bg-blue-500"
                                        )}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">{notif.title}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {notif.createdAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </ScrollArea>

                <div className="p-3 border-t">
                    <Button variant="outline" className="w-full" asChild>
                        <a href="/dashboard/notifications">View All Notifications</a>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}