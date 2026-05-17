import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { OrganizationStoreProvider } from "@/zustand/providers/organization-store-provider";
import { siteConfig } from "@/config/site";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
    title: siteConfig.name,
    description: siteConfig.description,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className="font-sans"
        >
            <body className="font-sans antialiased">
                <TooltipProvider>
                    <ThemeProvider>
                        <OrganizationStoreProvider>
                            {children}
                        </OrganizationStoreProvider>
                        <Toaster />
                    </ThemeProvider>
                </TooltipProvider>
            </body>
        </html>
    );
}
