"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import { siteConfig } from "@/config/site";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { CreateOrganizationForm } from "./forms/create-organization-form";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { cn, getPlanByProductId } from "@/lib/utils";
import Image from "next/image"; // ← Added

export function TeamSwitcher() {
    const { isMobile } = useSidebar();
    const { organizations, activeOrganization, setActiveOrganization } =
        useOrganizationStore((state) => state);

    const [dialogOpen, setDialogOpen] = React.useState(false);

    // ✅ Fixed: Wrapped in useCallback to stabilize the reference
    const handleChangeOrganization = React.useCallback(
        async (organizationId: string) => {
            try {
                await setActiveOrganization(organizationId);
                toast.success("Organization switched successfully");
            } catch (error) {
                console.error(error);
                toast.error("Failed to switch organization");
            }
        },
        [setActiveOrganization]
    );

    // ✅ Now safe — dependencies are stable
    React.useEffect(() => {
        if (!activeOrganization && organizations?.length > 0) {
            handleChangeOrganization(organizations[0].id);
        }
    }, [activeOrganization, organizations, handleChangeOrganization]);

    const plan = getPlanByProductId(
        activeOrganization?.subscription?.productId || "",
    );

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="group flex items-center justify-between w-full h-14 p-2.5 hover:bg-accent rounded-xl transition-all active:scale-95 duration-300 data-[state=open]:bg-accent"
                            >
                                <div className="flex items-center gap-3">
                                    {/* ✅ Fixed: Using Next.js Image for optimization */}
                                    <Image
                                        src={siteConfig.logoUrl}
                                        alt={`${siteConfig.name} logo`}
                                        width={36}
                                        height={36}
                                        className="rounded-xl shadow-lg shadow-primary/10 transition-transform duration-500 group-hover:rotate-12 object-contain"
                                        priority // Good for logo in sidebar
                                    />
                                    <div className="grid flex-1 text-left leading-tight overflow-hidden">
                                        <span className="text-sm font-medium tracking-tighter text-foreground truncate max-w-[120px]">
                                            {activeOrganization?.name}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-medium opacity-50">
                                            {plan ? plan.name : "Free Team"}
                                        </span>
                                    </div>
                                </div>
                                <ChevronsUpDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            className="w-56 rounded-xl shadow-xl border-border bg-background"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={12}
                        >
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-[0.25em] px-3 py-3 font-medium opacity-60">
                                Switch Organization
                            </DropdownMenuLabel>

                            {organizations?.map((org, index) => (
                                <DropdownMenuItem
                                    key={org.id}
                                    onClick={() => handleChangeOrganization(org.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg m-1 transition-all",
                                        activeOrganization?.id === org.id
                                            ? "bg-primary/5 text-primary font-medium"
                                            : "font-medium",
                                    )}
                                >
                                    <div className="size-6 rounded-lg border bg-muted/30 flex items-center justify-center">
                                        <Building2 className="size-3" />
                                    </div>
                                    <span className="text-xs uppercase tracking-tight">
                                        {org.name}
                                    </span>
                                    <DropdownMenuShortcut className="text-[9px] font-medium opacity-30">
                                        ⌘{index + 1}
                                    </DropdownMenuShortcut>
                                </DropdownMenuItem>
                            ))}

                            <DropdownMenuSeparator className="bg-border/50" />

                            <DropdownMenuItem
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg m-1 font-medium opacity-60 hover:opacity-100 transition-all text-xs uppercase tracking-tight"
                                onClick={() => setDialogOpen(true)}
                            >
                                <div className="flex size-6 items-center justify-center rounded-lg border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <span>Create Organization</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Dialog Content */}
                    <DialogContent showCloseButton={true}>
                        <DialogHeader>
                            <DialogTitle>Create Organization</DialogTitle>
                            <DialogDescription>
                                Create a new organization to get started.
                            </DialogDescription>
                        </DialogHeader>
                        <CreateOrganizationForm />
                    </DialogContent>
                </SidebarMenuItem>
            </SidebarMenu>
        </Dialog>
    );
}