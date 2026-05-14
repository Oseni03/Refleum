"use client";

import React from "react";
import {
    FileText,
    Sparkles,
    FileDown,
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Crown,
    Upload,
    ExternalLink,
    BarChart3,
    Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type {
    DashboardStats,
    ChartDataPoint,
    RecentResume,
    ActivityRecord,
} from "@/server/dashboard";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface DashboardClientProps {
    user: { name?: string | null; email: string; image?: string | null };
    stats: DashboardStats;
    chartData: ChartDataPoint[];
    recentResumes: RecentResume[];
    recentActivity: ActivityRecord[];
}

// ─────────────────────────────────────────────────────────
// Mini bar chart (no external dependency)
// ─────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: ChartDataPoint[] }) {
    const maxVal = Math.max(...data.map((d) => d.tailors + d.pdfs + d.parses), 1);

    return (
        <div className="flex items-end gap-1.5 h-24 w-full">
            {data.map((d, i) => {
                const total = d.tailors + d.pdfs + d.parses;
                const heightPct = (total / maxVal) * 100;
                return (
                    <div
                        key={i}
                        className="flex flex-col items-center gap-1 flex-1 group cursor-default"
                        title={`${d.date}: ${d.tailors} tailors, ${d.pdfs} PDFs, ${d.parses} parses`}
                    >
                        <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                            <div
                                className="w-full rounded-sm bg-primary/70 group-hover:bg-primary transition-all duration-200 min-h-[2px]"
                                style={{ height: `${Math.max(heightPct, 2)}%` }}
                            />
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 font-medium">
                            {d.date.split(" ")[1]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: string | number;
    growth?: number;
    icon: React.ElementType;
    description?: string;
}

function StatCard({ label, value, growth, icon: Icon, description }: StatCardProps) {
    const hasGrowth = growth !== undefined;
    const isUp = (growth ?? 0) > 0;
    const isNeutral = growth === 0 || growth === undefined;
    const TrendIcon = isNeutral ? Minus : isUp ? TrendingUp : TrendingDown;

    return (
        <Card className="bg-card border-border/50 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        {label}
                    </span>
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="size-4 text-primary" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </span>
                    {hasGrowth && (
                        <span
                            className={cn(
                                "text-[10px] font-semibold flex items-center gap-0.5",
                                isNeutral
                                    ? "text-muted-foreground"
                                    : isUp
                                        ? "text-emerald-500"
                                        : "text-destructive"
                            )}
                        >
                            <TrendIcon className="size-3" />
                            {isNeutral ? "—" : `${Math.abs(growth!)}%`}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────
// Resume status badge
// ─────────────────────────────────────────────────────────
function ResumeStatusBadge({ status }: { status: string }) {
    const config = {
        READY: { label: "Ready", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        PENDING: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
        PROCESSING: { label: "Processing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        FAILED: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
    }[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };

    return (
        <Badge variant="outline" className={cn("text-[10px] font-semibold border", config.className)}>
            {config.label}
        </Badge>
    );
}

// ─────────────────────────────────────────────────────────
// Activity operation icon
// ─────────────────────────────────────────────────────────
function ActivityIcon({ operation }: { operation: string }) {
    const config = {
        tailor: { icon: Sparkles, bg: "bg-primary/10", color: "text-primary" },
        parse: { icon: Upload, bg: "bg-blue-500/10", color: "text-blue-500" },
        pdf_export: { icon: FileDown, bg: "bg-amber-500/10", color: "text-amber-500" },
    }[operation] ?? { icon: CheckCircle2, bg: "bg-muted", color: "text-muted-foreground" };

    const Icon = config.icon;

    return (
        <div
            className={cn(
                "size-9 rounded-xl flex items-center justify-center shrink-0 border border-border/50",
                config.bg
            )}
        >
            <Icon className={cn("size-4", config.color)} />
        </div>
    );
}

function operationLabel(op: string) {
    return { tailor: "Resume Tailored", parse: "Resume Parsed", pdf_export: "PDF Exported" }[op] ?? op;
}

// ─────────────────────────────────────────────────────────
// Plan badge
// ─────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
    const config = {
        FREE: { label: "Free", className: "bg-muted text-muted-foreground" },
        STARTER: { label: "Starter", className: "bg-blue-500/10 text-blue-600" },
        PRO: { label: "Pro", className: "bg-primary/10 text-primary" },
        ENTERPRISE: { label: "Enterprise", className: "bg-amber-500/10 text-amber-600" },
    }[plan] ?? { label: plan, className: "bg-muted text-muted-foreground" };

    return (
        <Badge variant="secondary" className={cn("text-[10px] font-bold gap-1", config.className)}>
            <Crown className="size-2.5" />
            {config.label}
        </Badge>
    );
}

// ─────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────
export function DashboardClient({
    user,
    stats,
    chartData,
    recentResumes,
    recentActivity,
}: DashboardClientProps) {
    const firstName = user.name?.split(" ")[0] ?? "there";
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const totalApiCalls =
        stats.tailorsThisMonth + stats.pdfExportsThisMonth;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header ──────────────────────────────── */}
            <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        {greeting}, {firstName} 👋
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                        {" · "}
                        <PlanBadge plan={stats.subscription.plan} />
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2 h-9 rounded-xl text-xs font-medium">
                        <Link href="/dashboard/api-keys">
                            <ExternalLink className="size-3.5" />
                            API Keys
                        </Link>
                    </Button>
                    <Button asChild size="sm" className="gap-2 h-9 rounded-xl text-xs font-medium">
                        <a href="/docs" target="_blank" rel="noreferrer">
                            <BarChart3 className="size-3.5" />
                            API Docs
                        </a>
                    </Button>
                </div>
            </section>

            {/* ── Stats Grid ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Resumes"
                    value={stats.totalResumes}
                    icon={FileText}
                    description="All uploaded & tailored"
                />
                <StatCard
                    label="Tailored Resumes"
                    value={stats.tailoredResumes}
                    icon={Star}
                    description="Derived from master"
                />
                <StatCard
                    label="Tailors This Month"
                    value={stats.tailorsThisMonth}
                    growth={stats.tailorGrowth}
                    icon={Sparkles}
                    description="vs. previous 30 days"
                />
                <StatCard
                    label="PDF Exports"
                    value={stats.pdfExportsThisMonth}
                    growth={stats.pdfGrowth}
                    icon={FileDown}
                    description="vs. previous 30 days"
                />
            </div>

            {/* ── Main Content: Resumes + Activity ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Resumes */}
                <section className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground tracking-tight">
                            Recent Resumes
                        </h3>
                        <Link
                            href="/docs/api#resumes"
                            className="text-[10px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
                        >
                            API Ref →
                        </Link>
                    </div>

                    {recentResumes.length === 0 ? (
                        <Card className="border-border/50 rounded-2xl bg-muted/20">
                            <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
                                <div className="size-16 bg-card rounded-2xl flex items-center justify-center shadow border border-border/50">
                                    <FileText className="size-7 text-primary" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground">No resumes yet</h4>
                                    <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                                        Upload your first resume via the API to get started.
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="h-9 rounded-xl text-xs font-medium gap-2">
                                    <a href="/docs/api#resumes" target="_blank" rel="noreferrer">
                                        <Upload className="size-3.5" />
                                        View API Docs
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border/40">
                                    {recentResumes.map((resume) => (
                                        <li
                                            key={resume.id}
                                            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group"
                                        >
                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    "size-9 rounded-xl flex items-center justify-center shrink-0 border border-border/50",
                                                    resume.isMaster
                                                        ? "bg-primary/10"
                                                        : "bg-muted"
                                                )}
                                            >
                                                {resume.isMaster ? (
                                                    <Star className="size-4 text-primary" />
                                                ) : (
                                                    <Sparkles className="size-4 text-muted-foreground" />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                                                    {resume.title ?? resume.filename}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {resume.isMaster && (
                                                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                                                            Master
                                                        </span>
                                                    )}
                                                    {resume.strategy && (
                                                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                                                            {resume.strategy}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-muted-foreground/60">
                                                        {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right side */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {resume._count.coverletters > 0 && (
                                                    <span className="text-[9px] text-muted-foreground hidden sm:block">
                                                        {resume._count.coverletters} CL
                                                    </span>
                                                )}
                                                <ResumeStatusBadge status={resume.status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* Recent Activity */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground tracking-tight">
                            Activity
                        </h3>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            Last {recentActivity.length}
                        </span>
                    </div>

                    <Card className="border-border/50 rounded-2xl bg-card shadow-sm h-full overflow-hidden">
                        <CardContent className="p-5">
                            {recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-10">
                                    <Clock className="size-8 text-muted-foreground/40" />
                                    <p className="text-xs text-muted-foreground text-center">
                                        No API activity yet.
                                        <br />
                                        Make your first request to see usage here.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                                    {recentActivity.map((record) => (
                                        <li key={record.id} className="flex gap-3 relative z-10 group/item">
                                            <ActivityIcon operation={record.operation} />
                                            <div className="space-y-0.5 pt-1">
                                                <p className="text-xs font-semibold text-foreground leading-tight">
                                                    {operationLabel(record.operation)}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70">
                                                    {formatDistanceToNow(new Date(record.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>

            {/* ── Usage Chart ───────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground tracking-tight">
                        API Usage — Last 7 Days
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-primary inline-block" />
                            Tailors
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-amber-400 inline-block" />
                            PDFs
                        </span>
                    </div>
                </div>
                <Card className="border-border/50 rounded-2xl bg-card shadow-sm">
                    <CardContent className="p-6">
                        {totalApiCalls === 0 ? (
                            <div className="h-24 flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">
                                    No API calls recorded yet. Usage will appear here once you start tailoring resumes.
                                </p>
                            </div>
                        ) : (
                            <MiniBarChart data={chartData} />
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
