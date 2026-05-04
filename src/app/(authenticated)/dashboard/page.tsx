"use client";

import React from "react";
import {
	Filter,
	Plus,
	AlertTriangle,
	FolderOpen,
	CheckCircle2,
	Edit3,
	UserPlus,
	ArrowUp,
	ArrowDown,
	Cpu,
	Users,
	Zap,
	AlertCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
	const { data: session } = authClient.useSession();
	const user = session?.user;
	const firstName = user?.name?.split(" ")[0] || "there";

	const stats = [
		{
			label: "Total Views",
			value: "1.2M",
			change: "+12%",
			trend: "up",
			icon: Cpu,
			color: "text-primary",
		},
		{
			label: "Active Project",
			value: "42",
			change: "4",
			trend: "down",
			icon: Zap,
			color: "text-primary",
		},
		{
			label: "Active Users",
			value: "8,432",
			change: "+2%",
			trend: "up",
			icon: Users,
			color: "text-primary",
		},
		{
			label: "Average Growth",
			value: "12%",
			change: "Stable",
			trend: "neutral",
			icon: AlertCircle,
			color: "text-primary",
		},
	];

	const activities = [
		{
			title: "Project Published",
			description: "Version 2.4.1 successful",
			time: "2 minutes ago",
			icon: CheckCircle2,
			iconColor: "text-emerald-500",
			bgColor: "bg-emerald-500/10",
		},
		{
			title: "Project Updated",
			description: `${user?.name || "Alex Rivera"} modified 'Core API'`,
			time: "1 hour ago",
			icon: Edit3,
			iconColor: "text-primary",
			bgColor: "bg-muted",
		},
		{
			title: "Alert Triggered",
			description: "Latency spike in US-East-1",
			time: "3 hours ago",
			icon: AlertTriangle,
			iconColor: "text-destructive",
			bgColor: "bg-destructive/10",
		},
		{
			title: "New Team Member",
			description: "Sarah Chen joined Acme Corp",
			time: "5 hours ago",
			icon: UserPlus,
			iconColor: "text-primary",
			bgColor: "bg-muted",
		},
	];

	return (
		<div className="space-y-10 animate-in fade-in duration-500">
			{/* Page Header */}
			<section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-1">
					<h2 className="text-3xl font-semibold text-foreground">
						Overview
					</h2>
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">
						Good morning, {firstName} •{" "}
						{new Date().toLocaleDateString(undefined, {
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>
				<div className="flex gap-3">
					<Button
						variant="outline"
						size="sm"
						className="gap-2 h-10 px-5 border-border/50 bg-card hover:bg-accent hover:shadow-sm rounded-xl font-medium text-xs transition-all active:scale-95"
					>
						<Filter className="size-3.5" />
						Filter
					</Button>
					<Button
						size="sm"
						className="gap-2 h-10 px-6 bg-primary text-primary-foreground rounded-xl font-medium text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
					>
						<Plus className="size-3.5" />
						Create
					</Button>
				</div>
			</section>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{stats.map((stat, i) => (
					<Card
						key={i}
						className="bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group overflow-hidden"
					>
						<CardContent className="p-8">
							<div className="flex items-center justify-between mb-6">
								<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
									{stat.label}
								</span>
								<div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
									<stat.icon
										className={cn(
											"size-4.5",
											stat.color === "text-primary"
												? "group-hover:text-primary-foreground"
												: stat.color,
										)}
									/>
								</div>
							</div>
							<div className="flex items-baseline gap-2">
								<span className="text-2xl font-semibold tracking-tight text-foreground">
									{stat.value}
								</span>
								{stat.trend !== "neutral" && (
									<span
										className={cn(
											"text-[10px] font-medium flex items-center gap-0.5",
											stat.trend === "up"
												? "text-primary"
												: "text-muted-foreground",
										)}
									>
										{stat.trend === "up" ? (
											<ArrowUp className="size-3" />
										) : (
											<ArrowDown className="size-3" />
										)}
										{stat.change}
									</span>
								)}
							</div>
							<div className="mt-6 h-1.5 w-full bg-muted rounded-full overflow-hidden">
								<div
									className={cn(
										"h-full rounded-full bg-primary transition-all duration-1000 delay-300",
										stat.color === "text-destructive"
											? "bg-destructive"
											: "bg-primary",
									)}
									style={{
										width:
											i === 0
												? "75%"
												: i === 1
													? "40%"
													: i === 2
														? "60%"
														: "5%",
									}}
								/>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Main Content Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
				{/* Active Projects */}
				<section className="lg:col-span-2 space-y-6">
					<div className="flex items-center justify-between px-2">
						<h3 className="text-xl font-semibold tracking-tight text-foreground">
							Projects
						</h3>
						<Link
							href="#"
							className="text-[10px] font-medium text-muted-foreground hover:text-primary uppercase tracking-[0.2em] transition-colors"
						>
							View All &rarr;
						</Link>
					</div>
					<div className="border border-border/50 bg-muted/20 backdrop-blur-sm rounded-3xl h-[440px] flex flex-col items-center justify-center group cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 overflow-hidden relative">
						<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
						<div className="size-20 bg-card rounded-2xl flex items-center justify-center shadow-xl shadow-primary/5 border border-border/50 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
							<FolderOpen className="size-8 text-primary" />
						</div>
						<h4 className="text-lg text-foreground font-semibold tracking-tight mb-2 relative z-10">
							No Projects
						</h4>
						<p className="text-muted-foreground font-medium text-sm max-w-[280px] text-center mb-8 leading-relaxed opacity-70 relative z-10">
							You haven&apos;t created any projects yet.
						</p>
						<Button className="h-10 px-8 rounded-lg font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 shadow-sm">
							Create Project
						</Button>
					</div>
				</section>

				{/* Recent Activity */}
				<section className="space-y-6">
					<div className="flex items-center justify-between px-2">
						<h3 className="text-xl font-semibold tracking-tight text-foreground">
							Activity
						</h3>
					</div>
					<Card className="border-border rounded-3xl shadow-sm h-full overflow-hidden bg-card">
						<CardContent className="p-8">
							<div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border/50">
								{activities.map((activity, i) => (
									<div
										key={i}
										className="flex gap-5 relative z-10 group/item"
									>
										<div
											className={cn(
												"size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border transition-all duration-300 group-hover/item:scale-110",
												activity.bgColor === "bg-muted"
													? "bg-card"
													: activity.bgColor,
											)}
										>
											<activity.icon
												className={cn(
													"size-4",
													activity.iconColor,
												)}
											/>
										</div>
										<div className="space-y-0.5">
											<p className="text-sm font-semibold text-foreground leading-tight tracking-tight">
												{activity.title}
											</p>
											<p className="text-[11px] font-medium text-muted-foreground/70 leading-tight">
												{activity.description}
											</p>
											<div className="flex items-center gap-2 pt-0.5">
												<span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
													{activity.time}
												</span>
											</div>
										</div>
									</div>
								))}
								<div className="flex gap-4 relative z-10 pt-4">
									<div className="size-10 invisible shrink-0" />
									<Button
										variant="ghost"
										size="sm"
										className="text-[10px] text-primary font-semibold uppercase tracking-widest hover:bg-transparent hover:text-primary/80 p-0 h-auto group"
									>
										All Activity
										<span className="ml-1 transition-transform group-hover:translate-x-1">
											&rarr;
										</span>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>
			</div>
		</div>
	);
}
