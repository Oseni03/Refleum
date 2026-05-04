"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useIntegrations } from "@/hooks/use-integrations";
import { Skeleton } from "@/components/ui/skeleton"; // Make sure you have this component
import IntegrationsGrid from "@/components/dashboard/integrations-grid";

const categories = [
    "Featured",
    "Productivity",
    "Communication",
    "Marketing",
    "Developer Tools",
];

export default function IntegrationsPage() {
    const {
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        connectedIntegrations,
        loading,
        connecting,
        isDisconnectDialogOpen,
        integrationToDisconnect,
        setIsDisconnectDialogOpen,
        setIntegrationToDisconnect,
        handleConnect,
        handleDisconnect,
        confirmDisconnect,
        filteredIntegrations,
    } = useIntegrations();

    return (
        <>
            <div className="space-y-12">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tighter">
                            App Directory
                        </h2>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">
                            Standard SaaS Integrations
                        </p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            className="w-full pl-10 h-11 bg-card border-border rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                            placeholder="Search integrations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                activeCategory === category
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Integration Grid */}
                <IntegrationsGrid
                    loading={loading}
                    filteredIntegrations={filteredIntegrations}
                    connectedIntegrations={connectedIntegrations}
                    connecting={connecting}
                    handleConnect={handleConnect}
                    handleDisconnect={handleDisconnect}
                />
            </div>

            {/* Disconnect Dialog */}
            <AlertDialog
                open={isDisconnectDialogOpen}
                onOpenChange={setIsDisconnectDialogOpen}
            >
                <AlertDialogContent className="rounded-[32px] border-border/60 shadow-2xl p-10">
                    <AlertDialogHeader className="space-y-6">
                        <AlertDialogTitle className="text-xl font-medium tracking-tighter">
                            Disconnect Integration
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold p-4 bg-destructive/5 rounded-xl border border-destructive/10 leading-loose">
                            Are you sure you want to disconnect this integration? This will revoke access and stop all automated syncs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-4">
                        <AlertDialogCancel
                            className="h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest border-border/40 hover:bg-muted/10"
                            onClick={() => {
                                setIsDisconnectDialogOpen(false);
                                setIntegrationToDisconnect(null);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDisconnect}
                            className="bg-destructive text-destructive-foreground h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-destructive/10 active:scale-95"
                        >
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
