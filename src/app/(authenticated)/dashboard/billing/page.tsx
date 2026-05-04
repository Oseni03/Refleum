"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    Zap,
    Crown,
    ArrowRight,
    Download,
    Edit3,
    Info,
    Calendar,
    ReceiptText,
} from "lucide-react";
import { formatDate } from "date-fns";
import { useBilling } from "@/hooks/use-billing";

export default function BillingPage() {
    const {
        members,
        isAdmin,
        subscription,
        isLoading,
        error,
        handleSubscriptionAction,
        currentPlan,
        planName,
    } = useBilling();

    // Calculate usage metrics
    const currentMemberCount = members.length;
    const maxMembers =
        currentPlan?.id === "free" ? 3 : currentPlan?.id === "pro" ? 10 : 3;
    const usagePercentage = Math.min(
        (currentMemberCount / maxMembers) * 100,
        100,
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Area */}
            <div className="bg-background border border-border/60 rounded-xl p-10 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tighter">
                            Billing & Subscription
                        </h2>
                        <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                            Manage your plan and payment methods
                        </p>
                    </div>
                    <Button
                        onClick={handleSubscriptionAction}
                        className="w-full md:w-auto bg-primary text-primary-foreground px-8 h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-95"
                        disabled={isLoading || !isAdmin}
                    >
                        <span>
                            {subscription
                                ? "Manage Subscription"
                                : "Upgrade Plan"}
                        </span>
                        <Zap className="size-4 fill-current" />
                    </Button>
                </div>
                {error ? (
                    <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}
            </div>

            <div
                className={`grid grid-cols-1 ${subscription ? "lg:grid-cols-12" : ""} gap-8`}
            >
                {/* Active Plan Detail */}
                <div
                    className={`${subscription ? "lg:col-span-8" : ""} bg-background border border-border/60 rounded-xl p-10 shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-all relative overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] transition-opacity group-hover:opacity-[0.05]">
                        <Crown className="size-64 text-primary rotate-12" />
                    </div>

                    <div className="space-y-10 relative z-10">
                        <div className="flex items-center justify-between">
                            <Badge className="bg-primary/5 text-primary border-transparent px-4 py-1.5 text-[9px] font-medium tracking-[0.2em] uppercase rounded-lg">
                                Active Plan
                            </Badge>
                            {subscription && (
                                <div className="flex items-center gap-2.5 text-[10px] font-medium  uppercase tracking-widest opacity-40">
                                    <Calendar className="size-3.5" />
                                    Next Billing Date:{" "}
                                    {formatDate(
                                        new Date(subscription.currentPeriodEnd),
                                        "dd LLL yyyy",
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-semibold text-foreground tracking-tighter uppercase">
                                {planName}
                            </h3>
                            <p className=" font-medium text-sm max-w-xl leading-relaxed opacity-60">
                                {currentPlan?.description ||
                                    "Professional features for individuals and small teams."}
                            </p>
                        </div>

                        <div className="space-y-5 max-w-md">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                    Usage (Team Members)
                                </span>
                                <span className="text-xs font-medium">
                                    <span className="text-foreground tracking-widest">
                                        {currentMemberCount}
                                    </span>{" "}
                                    <span className=" opacity-30">
                                        / {maxMembers} AVAILABLE
                                    </span>
                                </span>
                            </div>
                            <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden shadow-inner p-0.5">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                    style={{ width: `${usagePercentage}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2.5 text-[9px] font-medium /40 uppercase tracking-widest">
                                <Info className="size-3.5" />
                                {maxMembers - currentMemberCount > 0
                                    ? `${maxMembers - currentMemberCount} More members can be added to your current plan.`
                                    : "You've reached the member limit for your current plan."}
                            </div>
                        </div>
                    </div>

                    <div className="mt-14 pt-8 border-t border-border/40 flex flex-wrap gap-8 items-center relative z-10">
                        <button className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground flex items-center gap-3 group/btn transition-colors hover:text-primary active:scale-95">
                            Upgrade Plan
                            <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-1.5" />
                        </button>
                        <button className="text-[10px] font-medium uppercase tracking-[0.2em] /40 hover:text-destructive transition-colors">
                            Cancel Subscription
                        </button>
                    </div>
                </div>

                {/* Payment Method Card */}
                {subscription && (
                    <div className="lg:col-span-4 bg-background border border-border/60 rounded-xl p-10 shadow-sm flex flex-col gap-10 group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold tracking-tighter">
                                    Payment Method
                                </h3>
                                <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                    Managed by Polar
                                </p>
                            </div>
                            <Button
                                onClick={handleSubscriptionAction}
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-xl  hover:bg-muted/20 hover:text-primary transition-all active:scale-95"
                                disabled={isLoading}
                            >
                                <Edit3 className="size-4.5" />
                            </Button>
                        </div>

                        {/* Premium Credit Card UI */}
                        <div className="relative aspect-[1.58/1] w-full bg-foreground rounded-xl p-7 text-primary-foreground overflow-hidden shadow-sm flex flex-col justify-between group/card transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="size-10 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center">
                                    <CreditCard className="size-6 text-white/80" />
                                </div>
                                <span className="text-[10px] font-medium tracking-[0.3em] opacity-30">
                                    {subscription.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="relative z-10 space-y-5">
                                <p className="text-xl font-medium tracking-[0.25em] font-mono leading-none">
                                    •••• •••• ••••{" "}
                                    {subscription.customerId.slice(-4)}
                                </p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-medium uppercase tracking-widest opacity-30 mb-1.5">
                                            NEXT BILLING
                                        </p>
                                        <p className="text-xs font-medium tracking-widest">
                                            {formatDate(
                                                new Date(
                                                    subscription.currentPeriodEnd,
                                                ),
                                                "dd/MM/yy",
                                            )}
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-medium tracking-[0.1em] uppercase opacity-60">
                                        ${subscription.amount / 100}/
                                        {subscription.recurringInterval ===
                                            "yearly"
                                            ? "yr"
                                            : "mo"}
                                    </p>
                                </div>
                            </div>

                            {/* Aesthetic Gradient */}
                            <div className="absolute -right-12 -top-12 size-48 bg-primary/30 rounded-full blur-3xl opacity-20 group-hover/card:opacity-40 transition-opacity duration-1000" />
                            <div className="absolute -left-12 -bottom-12 size-48 bg-indigo-500/20 rounded-full blur-3xl" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                        </div>

                        <div className="space-y-6 pt-2 border-t border-border/40">
                            <div>
                                <h4 className="text-[9px] font-medium  uppercase tracking-[0.2em] mb-3 opacity-40">
                                    Billing Information
                                </h4>
                                <p className="text-xs font-medium text-foreground/80 leading-loose opacity-60">
                                    Payment methods and billing details are
                                    managed through our secure billing portal.
                                    <br />
                                    Click the edit button above to update your
                                    payment information.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoices Table */}
            {subscription && (
                <div className="bg-background border border-border/60 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-10 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/5 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-primary/5 rounded-xl flex items-center justify-center">
                                <ReceiptText className="size-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold tracking-tighter">
                                    Billing History
                                </h3>
                                <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                    Your recent invoices and receipts
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSubscriptionAction}
                            variant="outline"
                            size="sm"
                            className="h-11 px-6 font-medium uppercase text-[10px] tracking-widest rounded-xl gap-3 shadow-none border-border/60 hover:bg-muted/10 transition-all active:scale-95"
                            disabled={isLoading}
                        >
                            <Download className="size-4" />
                            <span>View All Invoices</span>
                        </Button>
                    </div>
                    <div className="p-10 text-center">
                        <div className="space-y-4">
                            <ReceiptText className="size-16 text-muted-foreground/50 mx-auto" />
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-foreground">
                                    Billing History Available
                                </h4>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                    Your invoices and billing history are
                                    securely stored and managed through our
                                    billing partner. Click &quot;View All
                                    Invoices&quot; above to access your complete
                                    billing history and download receipts.
                                </p>
                            </div>
                            <Button
                                onClick={handleSubscriptionAction}
                                variant="outline"
                                className="mt-4 px-6 font-medium uppercase text-[10px] tracking-widest rounded-xl shadow-none border-border/60 hover:bg-muted/10 transition-all active:scale-95"
                                disabled={isLoading}
                            >
                                Access Billing Portal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
