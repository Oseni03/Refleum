import React from "react";
import { siteConfig } from "@/config/site";
import { Twitter, Linkedin, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: `Contact — ${siteConfig.name}`,
    description: `Get in touch with the ${siteConfig.name} team.`,
};

export default function ContactPage(): React.ReactElement {
    return (
        <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
            {/* Header */}
            <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">Get in touch</h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                    Questions about the API, billing, or your organisation? We&apos;d love to hear from you.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Social channels */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Follow us</h2>
                    <div className="space-y-4">
                        <a
                            href={siteConfig.links.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                        >
                            <div className="size-11 rounded-lg bg-foreground text-background flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Twitter className="size-5 fill-current" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground text-sm">X (Twitter)</p>
                                <p className="text-xs text-muted-foreground">Announcements and updates</p>
                            </div>
                        </a>

                        <a
                            href={siteConfig.links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                        >
                            <div className="size-11 rounded-lg bg-[#0077B5] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Linkedin className="size-5 fill-current" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground text-sm">LinkedIn</p>
                                <p className="text-xs text-muted-foreground">Professional network and insights</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Direct support */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Direct support</h2>
                    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
                        <div className="space-y-2">
                            <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                <Mail className="size-5" />
                            </div>
                            <h3 className="font-semibold text-foreground">Email support</h3>
                            <p className="text-sm text-muted-foreground">
                                Reach out for technical help, billing questions, or enterprise enquiries.
                                We typically respond within one business day.
                            </p>
                        </div>
                        <Button asChild className="w-full gap-2">
                            <a href={`mailto:support@${new URL(siteConfig.url).hostname}`}>
                                <MessageSquare className="size-4" />
                                Send a message
                            </a>
                        </Button>
                    </div>

                    {/* Enterprise */}
                    <div className="p-6 rounded-xl border border-border bg-card space-y-3">
                        <h3 className="font-semibold text-foreground text-sm">Enterprise enquiries</h3>
                        <p className="text-xs text-muted-foreground">
                            Interested in a custom plan, volume pricing, or dedicated support? Contact us
                            at{" "}
                            <a
                                href={`mailto:enterprise@${new URL(siteConfig.url).hostname}`}
                                className="text-primary underline underline-offset-4"
                            >
                                enterprise@{new URL(siteConfig.url).hostname}
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}