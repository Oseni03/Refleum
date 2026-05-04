"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Lock,
    Shield,
    Loader2,
    LogOut,
} from "lucide-react";
import {
    getActiveSessions,
    revokeOtherSessions,
    getTwoFactorStatus,
} from "@/server/security";
import { toast } from "sonner";
import { Session } from "better-auth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SecurityForm } from "../forms/security-form";
import MFAStatus from "./mfa-status";
import Sessions from "./sessions";

const SecurityCard = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isRevokingSessions, setIsRevokingSessions] = useState(false);
    const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
    const [twoFactorStatus, setTwoFactorStatus] = useState({
        enabled: false,
        hasSetup: false,
    });
    const [isLoading2FA, setIsLoading2FA] = useState(true);

    useEffect(() => {
        loadSecurityData();
    }, []);

    const loadSecurityData = async () => {
        try {
            const [sessionsResult, twoFactorResult] = await Promise.all([
                getActiveSessions(),
                getTwoFactorStatus(),
            ]);

            if (sessionsResult.success && sessionsResult.data) {
                setSessions(sessionsResult.data);
            }
            if (twoFactorResult.success && twoFactorResult.data) {
                setTwoFactorStatus(twoFactorResult.data);
            }
        } catch (error) {
            console.error("Failed to load security data:", error);
        } finally {
            setIsLoadingSessions(false);
            setIsLoading2FA(false);
        }
    };

    const handleRevokeOtherSessions = () => setIsRevokeDialogOpen(true);

    const confirmRevokeSessions = async () => {
        setIsRevokingSessions(true);
        try {
            const result = await revokeOtherSessions();
            if (result.success) {
                toast.success(result.message);
                loadSecurityData();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to revoke sessions");
        } finally {
            setIsRevokingSessions(false);
            setIsRevokeDialogOpen(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Primary Actions */}
                <div className="lg:col-span-5 space-y-10">
                    {/* Password Section */}
                    <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Lock className="size-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold tracking-tighter">
                                    Security
                                </h3>
                                <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                    Manage your password and keys
                                </p>
                            </div>
                        </div>

                        <SecurityForm />
                    </div>
                </div>

                {/* Right Column: Status & Sessions */}
                <div className="lg:col-span-7 space-y-10">
                    {/* MFA Status */}
                    <MFAStatus onSuccess={loadSecurityData} twoFactorStatus={twoFactorStatus} isLoading2FA={isLoading2FA} />

                    {/* Sessions Section */}
                    <Sessions
                        sessions={sessions}
                        isLoadingSessions={isLoadingSessions}
                        handleRevokeOtherSessions={handleRevokeOtherSessions}
                        isRevokingSessions={isRevokingSessions} />

                    {/* Security Score Banner */}
                    <div className="bg-primary text-primary-foreground rounded-[32px] p-10 relative overflow-hidden group shadow-2xl shadow-primary/20">
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-5xl font-medium tracking-tighter">
                                    92
                                </h3>
                                <p className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-60">
                                    Security Score
                                </p>
                            </div>
                            <p className="text-xs font-bold leading-relaxed opacity-80 max-w-[240px]">
                                Your account is currently rated as &quot;Highly
                                Secure&quot;. Complete the remaining steps to
                                reach 100%.
                            </p>
                            <Button className="bg-white text-primary rounded-xl h-14 px-8 font-medium uppercase text-[11px] tracking-widest hover:bg-white/90 shadow-2xl active:scale-95 transition-all">
                                Review Security
                            </Button>
                        </div>
                        <Shield className="absolute -right-12 -bottom-12 size-64 text-white/5 -rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-1000" />

                        {/* Decorative scan line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/10 blur-sm animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Revoke Sessions Confirmation Dialog */}
            <AlertDialog
                open={isRevokeDialogOpen}
                onOpenChange={setIsRevokeDialogOpen}
            >
                <AlertDialogContent className="rounded-[32px] border-border/60 shadow-2xl p-10">
                    <AlertDialogHeader className="space-y-6">
                        <AlertDialogTitle className="text-xl font-medium tracking-tighter">
                            Revoke Other Sessions
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold  p-4 bg-destructive/5 rounded-xl border border-destructive/10 leading-loose">
                            This will sign out all other devices and browsers
                            that are currently logged into your account. You
                            will remain signed in on this device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-4">
                        <AlertDialogCancel className="h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest border-border/40 hover:bg-muted/10">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRevokeSessions}
                            disabled={isRevokingSessions}
                            className="bg-destructive text-destructive-foreground h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-destructive/10 active:scale-95"
                        >
                            {isRevokingSessions ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Revoking...
                                </>
                            ) : (
                                <>
                                    <LogOut className="size-4" />
                                    Revoke Sessions
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SecurityCard;
