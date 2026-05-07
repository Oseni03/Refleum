"use client";

import React, { useState } from "react";
import {
    Building2,
    Edit,
    Loader2,
    Trash2,
    Globe,
    Lock,
    Shield,
    Copy,
    Check,
} from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { UpdateOrganizationForm } from "@/components/forms/update-organization-form";
import { toast } from "sonner";
import { Organization } from "@/types";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


export default function SettingsPage() {
    const { activeOrganization, isAdmin, deleteOrganization } =
        useOrganizationStore((state) => state);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!activeOrganization) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-muted rounded-xl border border-border" />
            </div>
        );
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const handleDeleteConfirm = async () => {
        try {
            toast.loading("Deleting organization...");
            setIsLoading(true);

            const { success } = await deleteOrganization(activeOrganization.id);

            if (!success) {
                toast.dismiss();
                toast.error("Failed to delete organization");
            } else {
                toast.dismiss();
                toast.success("Organization deleted successfully");
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Failed to delete organization");
        } finally {
            setIsLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-medium tracking-tighter">
                            Organization Settings
                        </h2>
                        <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                            General information
                        </p>
                    </div>
                    {isAdmin && (
                        <Button
                            variant="default"
                            onClick={() => setUpdateDialogOpen(true)}
                            className="w-full md:w-auto bg-primary text-primary-foreground px-8 h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/10"
                        >
                            <Edit className="size-4" />
                            <span>Edit Settings</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings Card */}
                <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm space-y-10 flex flex-col">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-primary/5 rounded-xl flex items-center justify-center">
                            <Building2 className="size-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium tracking-tighter">
                                Basic Info
                            </h3>
                            <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                General Info
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        {/* Workspace Name */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40 ml-1">
                                Organization Name
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 text-base font-medium text-foreground bg-muted/20 px-6 h-16 flex items-center rounded-xl border border-border/40 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                                    {activeOrganization.name}
                                </div>
                            </div>
                        </div>

                        {/* Slug / Public Identifier */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40 ml-1">
                                Workspace ID
                            </label>
                            <div className="relative group/slug">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-medium  uppercase tracking-widest opacity-20">
                                    ID:
                                </span>
                                <Input
                                    readOnly
                                    value={activeOrganization.slug}
                                    className="w-full pl-16 pr-14 h-16 bg-muted/10 border border-border/40 rounded-xl text-xs font-medium text-foreground cursor-default focus:outline-none transition-all"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        copyToClipboard(activeOrganization.slug)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-xl hover:bg-primary/5 transition-colors group/copy"
                                >
                                    {copied ? (
                                        <Check className="size-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="size-4  opacity-40 group-hover/copy:opacity-100 transition-opacity" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="size-4  opacity-40" />
                            <span className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                Created At
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-foreground uppercase tracking-widest opacity-60">
                            {format(
                                new Date(activeOrganization.createdAt),
                                "dd • LLL • yyyy",
                            )}
                        </span>
                    </div>
                </div>

                {/* Visibility & Security Card */}
                <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm space-y-10 flex flex-col">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Globe className="size-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium tracking-tighter">
                                Access Control
                            </h3>
                            <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                Visibility
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="group relative p-6 rounded-[24px] border border-primary/20 bg-primary/[0.02] transition-all hover:bg-primary/5">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <div className="size-4 rounded-full border-2 border-primary flex items-center justify-center shadow-[0_0_8px_rgba(var(--primary),0.3)]">
                                        <div className="size-1.5 rounded-full bg-primary" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                                            Private Organization
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent text-[8px] font-medium tracking-[0.2em] uppercase h-4 px-1.5 rounded-md"
                                        >
                                            ACTIVE
                                        </Badge>
                                    </div>
                                    <p className="text-[10px]  font-bold leading-relaxed opacity-60">
                                        Only invited members can join this
                                        organization. Manual approval required
                                        for all other requests.
                                    </p>
                                </div>
                                <Lock className="size-4  opacity-20" />
                            </div>
                        </div>

                        <div className="group relative p-6 rounded-[24px] border border-border/40 bg-muted/5 opacity-40 grayscale transition-all cursor-not-allowed">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <div className="size-4 rounded-full border-2 border-border/60" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-foreground uppercase tracking-wider opacity-60">
                                            Public Mode
                                        </span>
                                    </div>
                                    <p className="text-[10px]  font-bold leading-relaxed">
                                        Allow anyone with a verified email
                                        domain to join. Recommended for large
                                        companies.
                                    </p>
                                </div>
                                <Globe className="size-4  opacity-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-background border border-destructive/20 rounded-[32px] p-10 shadow-sm relative overflow-hidden group/danger">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] transition-opacity group-hover/danger:opacity-[0.07]">
                    <Trash2 className="size-40 text-destructive rotate-12" />
                </div>

                <div className="flex items-center gap-4 mb-10">
                    <div className="size-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                        <Trash2 className="size-6 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium tracking-tighter text-destructive">
                            Delete Organization
                        </h3>
                        <p className="text-[10px] font-medium text-destructive/60 uppercase tracking-[0.2em]">
                            Danger Zone
                        </p>
                    </div>
                </div>

                <div className="bg-destructive/[0.02] border border-destructive/10 rounded-[24px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2 max-w-xl">
                        <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">
                            Delete Organization
                        </h4>
                        <p className="text-[11px]  font-medium leading-relaxed opacity-60">
                            This will permanently delete the organization, all
                            associated projects, and all team data.
                            <span className="block mt-1 text-destructive/80">
                                THIS ACTION CANNOT BE UNDONE.
                            </span>
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={!isAdmin}
                        className="w-full md:w-auto bg-destructive text-destructive-foreground px-8 h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest hover:opacity-90 transition-all shadow-xl shadow-destructive/10 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Trash2 className="size-4" />
                        <span>Delete Organization</span>
                    </Button>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                <DialogContent className="rounded-[32px] border-border/60 shadow-2xl p-0 overflow-hidden max-w-lg">
                    <div className="p-10 space-y-8">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-medium tracking-tighter">
                                Edit Organization
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold ">
                                Update your organization details and settings.
                            </DialogDescription>
                        </DialogHeader>
                        <UpdateOrganizationForm
                            organization={activeOrganization as Organization}
                            onSuccess={() => setUpdateDialogOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent className="rounded-[32px] border-border/60 shadow-2xl p-10">
                    <AlertDialogHeader className="space-y-6">
                        <AlertDialogTitle className="text-xl font-medium tracking-tighter">
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold  p-4 bg-destructive/5 rounded-xl border border-destructive/10 leading-loose">
                            You are about to permanently delete{" "}
                            <span className="text-foreground font-medium uppercase tracking-widest">
                                {activeOrganization.name}
                            </span>
                            . This will result in the immediate removal of all
                            projects and team members.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-4">
                        <AlertDialogCancel className="h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest border-border/40 hover:bg-muted/10">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-destructive/10 active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
