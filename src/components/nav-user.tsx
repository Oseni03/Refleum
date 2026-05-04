"use client";

import {
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles,
    UserCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NavUser() {
    const { user } = authClient.useSession().data || {};
    const { isMobile } = useSidebar();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            toast.info("Signing out");
            authClient.signOut();
            toast.success("Signed out");
            router.push("/");
        } catch (error) {
            console.log("Error signing out: ", error);
            toast.error("Error signing out");
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="w-full h-auto p-3 flex items-center gap-4 hover:bg-accent dark:hover:bg-accent rounded-xl cursor-pointer transition-all text-left group active:scale-95 duration-300 data-[state=open]:bg-accent dark:data-[state=open]:bg-accent"
                        >
                            <Avatar className="size-9 rounded-xl border border-border shadow-sm group-hover:scale-105 transition-transform">
                                <AvatarImage
                                    src={user?.image || ""}
                                    alt={user?.name || "Avatar"}
                                />
                                <AvatarFallback className="text-[10px] font-medium bg-muted rounded-xl">
                                    {user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-medium text-foreground tracking-tight truncate">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-[9px] text-muted-foreground uppercase font-medium tracking-widest opacity-40 truncate">
                                    Account
                                </p>
                            </div>
                            <ChevronsUpDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 rounded-xl shadow-xl border-border bg-background"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={12}
                    >
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-[0.25em] px-3 py-3 font-medium opacity-60">
                            My Account
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg m-1 font-medium text-xs uppercase tracking-tight"
                                onClick={() =>
                                    router.push("/settings")
                                }
                            >
                                <UserCircle className="size-4" />
                                Profile
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg m-1 font-medium text-xs uppercase tracking-tight"
                                onClick={() =>
                                    router.push("/dashboard/billing")
                                }
                            >
                                <Sparkles className="size-4" />
                                Billing
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-3 py-2.5 rounded-lg m-1 font-medium text-xs uppercase tracking-tight"
                            onClick={handleSignOut}
                        >
                            <LogOut className="size-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
