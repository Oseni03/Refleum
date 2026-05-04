"use client"

import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from '@/lib/utils';

interface MFAStatusProps {
    onSuccess: () => Promise<void>;
    twoFactorStatus: { enabled: boolean; hasSetup: boolean };
    isLoading2FA: boolean;
}

export default function MFAStatus({ onSuccess, twoFactorStatus, isLoading2FA }: MFAStatusProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPassword, setModalPassword] = useState("");
    const [isProcessing2FA, setIsProcessing2FA] = useState(false);

    const handleEnable2FA = async () => {
        if (!modalPassword.trim()) {
            toast.error("Password is required");
            return;
        }

        setIsProcessing2FA(true);
        try {
            const result = await authClient.twoFactor.enable({
                password: modalPassword,
            });

            if (result.data) {
                toast.success("2FA setup initiated. Check your authenticator app.");
                setIsModalOpen(false);
                setModalPassword("");
                onSuccess();
            }
        } catch (error) {
            toast.error("Failed to enable 2FA");
        } finally {
            setIsProcessing2FA(false);
        }
    };
    return (
        <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="size-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium tracking-tighter">
                            Two-Factor Auth
                        </h3>
                        <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-[0.2em] opacity-60">
                            {isLoading2FA
                                ? "Loading..."
                                : twoFactorStatus.enabled
                                    ? "Enhanced Security"
                                    : "Not Enabled"}
                        </p>
                    </div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer scale-90">
                    <Dialog
                        open={isModalOpen}
                        onOpenChange={setIsModalOpen}
                    >
                        <DialogTrigger asChild>
                            <div
                                className={cn(
                                    "w-12 h-7 rounded-full flex items-center px-1 transition-colors",
                                    twoFactorStatus.enabled
                                        ? "bg-emerald-500"
                                        : "bg-muted",
                                )}
                            >
                                <div
                                    className={cn(
                                        "size-5 rounded-full shadow-lg transition-transform",
                                        twoFactorStatus.enabled
                                            ? "translate-x-full bg-white"
                                            : "bg-white/50",
                                    )}
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    Enable Two-Factor Authentication
                                </DialogTitle>
                                <DialogDescription>
                                    Enter your password to enable
                                    2FA. You&apos;ll need to scan a
                                    QR code with your authenticator
                                    app.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={modalPassword}
                                        onChange={(e) =>
                                            setModalPassword(
                                                e.target.value,
                                            )
                                        }
                                        className="bg-muted/20 border-border/40 h-12 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setModalPassword("");
                                    }}
                                    disabled={isProcessing2FA}
                                    className="h-12 px-6"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleEnable2FA}
                                    disabled={
                                        isProcessing2FA ||
                                        !modalPassword.trim()
                                    }
                                    className="h-12 px-6"
                                >
                                    {isProcessing2FA ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                            Enabling...
                                        </>
                                    ) : (
                                        "Enable 2FA"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <p className="text-xs  font-bold leading-relaxed mb-8 opacity-60">
                Secure your account with two-factor authentication.
            </p>
            {twoFactorStatus.enabled ? (
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                    <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400 leading-tight uppercase tracking-wide">
                        Authenticator app verification is currently
                        active and verified.
                    </p>
                </div>
            ) : (
                <div className="p-6 bg-muted/10 border border-border/40 rounded-xl">
                    <p className="text-[11px] font-medium  leading-tight">
                        Enable two-factor authentication to add an
                        extra layer of security to your account.
                    </p>
                </div>
            )}
        </div>
    )
}
