import React from 'react'
import { cn } from '@/lib/utils'
import { History, Monitor, Smartphone, Loader2, LogOut } from 'lucide-react'
import type { Session } from 'better-auth';

export default function Sessions({
    sessions,
    isLoadingSessions,
    handleRevokeOtherSessions,
    isRevokingSessions
}: {
    sessions: Session[];
    isLoadingSessions: boolean;
    handleRevokeOtherSessions: () => void;
    isRevokingSessions: boolean;
}) {
    return (
        <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <History className="size-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium tracking-tighter">
                            Live Sessions
                        </h3>
                        <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                            Current active devices
                        </p>
                    </div>
                </div>
                <span className="bg-muted/20 border border-border/40 text-[9px] font-medium h-5 uppercase tracking-widest px-2.5 rounded-md flex items-center">
                    {isLoadingSessions
                        ? "..."
                        : `${sessions.length} ACTIVE`}
                </span>
            </div>

            <div className="space-y-8">
                {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 ">
                        <Monitor className="size-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                            No active sessions
                        </p>
                    </div>
                ) : (
                    sessions.map((session, i) => (
                        <div
                            key={session.id}
                            className={cn(
                                "flex items-start gap-5 group/session transition-all duration-300",
                                session.id !== sessions[0]?.id &&
                                "opacity-40 hover:opacity-100",
                            )}
                        >
                            <div className="size-12 rounded-xl border border-border/40 bg-muted/10 flex items-center justify-center shrink-0 group-hover/session:border-primary/40 transition-colors">
                                {session.userAgent?.includes(
                                    "Mobile",
                                ) ||
                                    session.userAgent?.includes(
                                        "iPhone",
                                    ) ||
                                    session.userAgent?.includes(
                                        "Android",
                                    ) ? (
                                    <Smartphone className="size-5 " />
                                ) : (
                                    <Monitor className="size-5 " />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-medium truncate tracking-tight">
                                        {session.userAgent?.split(
                                            " ",
                                        )[0] || "Unknown Device"}
                                    </p>
                                    {session.id ===
                                        sessions[0]?.id && (
                                            <span className="text-[8px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium uppercase tracking-tighter">
                                                CURRENT
                                            </span>
                                        )}
                                </div>
                                <p className="text-[10px] font-bold  truncate opacity-60 mt-1">
                                    {session.ipAddress ||
                                        "Unknown Location"}{" "}
                                    •{" "}
                                    {session.userAgent
                                        ?.split(" ")
                                        .slice(1)
                                        .join(" ") ||
                                        "Unknown Browser"}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-12 pt-8 border-t border-border/40">
                <button
                    onClick={handleRevokeOtherSessions}
                    disabled={isRevokingSessions}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-destructive/5 text-[10px] font-medium uppercase tracking-[0.2em]  hover:text-destructive transition-all border border-transparent hover:border-destructive/20 disabled:opacity-50"
                >
                    {isRevokingSessions ? (
                        <Loader2 className="size-3 animate-spin" />
                    ) : (
                        <LogOut className="size-3" />
                    )}
                    Sign out other devices
                </button>
            </div>
        </div>
    )
}
