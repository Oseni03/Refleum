import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { OrganizationStoreProvider } from "@/zustand/providers/organization-store-provider";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400"],
});

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
            className={cn(jetbrainsMono.variable, "font-sans", inter.variable)}
        >
            <body className={`font-sans antialiased`}>
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
