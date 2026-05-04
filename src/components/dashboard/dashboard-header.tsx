"use client";

import React, { useEffect, useState } from "react";
import { Search, Bell, ChevronRight, Moon, Sun, Monitor } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { siteConfig } from "@/config/site";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationsDropdown } from "./notifications-dropdown";

export function DashboardHeader() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const pathSegments = pathname.split("/").filter(Boolean);
    const currentPage = pathSegments[pathSegments.length - 1] || "Dashboard";
    const formattedPage =
        currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

    const currentTheme = mounted ? theme : "system";
    const ThemeIcon =
        currentTheme === "dark"
            ? Moon
            : currentTheme === "light"
                ? Sun
                : Monitor;

    const cycleTheme = () => {
        if (!mounted) return;
        if (theme === "light") {
            setTheme("dark");
        } else if (theme === "dark") {
            setTheme("system");
        } else {
            setTheme("light");
        }
    };

    return (
        <header className="h-16 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40 border-b border-border/60">
            {/* Left: Sidebar Toggle + Breadcrumb */}
            <div className="flex items-center gap-3 text-muted-foreground">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4 data-[orientation=vertical]:h-4" />
                <img
                    src={siteConfig.logoUrl}
                    alt={`${siteConfig.name} logo`}
                    className="h-5 w-5 rounded object-contain"
                />
                <ChevronRight className="size-3" />
                <span className="text-sm font-semibold text-foreground">
                    {formattedPage}
                </span>
            </div>

            {/* Search, Theme Toggle & Notifications */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle theme"
                    onClick={cycleTheme}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ThemeIcon className="size-5 transition-transform duration-300" />
                </Button>
                <NotificationsDropdown />
            </div>
        </header>
    );
}
