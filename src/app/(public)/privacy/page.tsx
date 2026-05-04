import React from "react";
import Header from "@/components/homepage/header";
import Footer from "@/components/homepage/footer";
import { siteConfig } from "@/config/site";

export const metadata = {
    title: `Privacy Policy - ${siteConfig.name}`,
    description: `Read our privacy policy to understand how we handle your data.`,
};

export default function PrivacyPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                <section className="py-24 px-4 bg-background">
                    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">
                                Privacy Policy
                            </h1>
                            <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
                                Last Updated: {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        
                        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-foreground/80 leading-relaxed">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
                                <p>
                                    We collect information that you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, and any other information you choose to provide.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">2. How We Use Information</h2>
                                <p>
                                    We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about your account and our services.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">3. Information Sharing</h2>
                                <p>
                                    We do not share your personal information with third parties except as described in this policy or with your consent.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-foreground">4. Security</h2>
                                <p>
                                    We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
                                </p>
                            </section>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
