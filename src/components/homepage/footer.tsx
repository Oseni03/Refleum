import { siteConfig } from "@/config/site";
import Link from "next/link";
import React from "react";

function Footer() {
    return (
        <footer className="w-full border-t border-border bg-background">
            <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between px-8 py-12 md:flex-row">
                <div className="mb-8 md:mb-0">
                    <span className="text-sm font-medium uppercase tracking-widest text-foreground">
                        {siteConfig.name}
                    </span>
                    <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                        © {new Date().getFullYear()} {siteConfig.name} Inc. Built for builders.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-8">
                    <Link
                        className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        href="/privacy"
                    >
                        Privacy
                    </Link>
                    <Link
                        className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        href="/terms"
                    >
                        Terms
                    </Link>
                    <Link
                        className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        href="/security"
                    >
                        Security
                    </Link>
                    <Link
                        className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        href="/status"
                    >
                        Status
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export default Footer;