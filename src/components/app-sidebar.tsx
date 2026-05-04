"use client"

import * as React from "react";
import {
    Settings,
    LayoutDashboard,
    Users2,
    CreditCard,
    ExternalLink,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { FeedbackModal } from "@/components/feedback-modal";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const dashboardItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        url: "/dashboard",
    },
    {
        id: "members",
        label: "Members",
        icon: Users2,
        url: "/dashboard/members",
    },
    {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        url: "/dashboard/billing",
    },
    {
        id: "integrations",
        label: "Integrations",
        icon: ExternalLink,
        url: "/dashboard/integrations",
    },
    {
        id: "settings",
        label: "Settings",
        icon: Settings,
        url: "/dashboard/settings",
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-border bg-sidebar"
            {...props}
        >
            <SidebarHeader className="pt-4 px-3">
                <TeamSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={dashboardItems} />
            </SidebarContent>
            <SidebarFooter className="pb-6 px-3 gap-2">
                <FeedbackModal />
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
