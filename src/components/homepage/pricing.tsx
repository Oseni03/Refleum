import { SUBSCRIPTION_PLANS } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

function Pricing() {
    return (
        <section
            id="pricing"
            className="mx-auto max-w-[1400px] px-container-padding py-24"
        >
            <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    Simple pricing.
                </h2>
                <p className="text-lg text-muted-foreground">
                    Plans that scale with your growth.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                    <div className="mb-8">
                        <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                            Free
                        </span>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-semibold text-foreground">
                                {SUBSCRIPTION_PLANS[0].price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {SUBSCRIPTION_PLANS[0].period}
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            {SUBSCRIPTION_PLANS[0].description}
                        </p>
                    </div>

                    <ul className="mb-8 flex-grow space-y-4">
                        {SUBSCRIPTION_PLANS[0].features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                                <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href="/signup"
                        className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                    >
                        Get Started
                    </Link>
                </div>

                <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">
                        Most Popular
                    </div>

                    <div className="mb-8">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                            {SUBSCRIPTION_PLANS[1].name}
                        </span>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-semibold text-foreground">
                                {SUBSCRIPTION_PLANS[1].price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {SUBSCRIPTION_PLANS[1].period}
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            {SUBSCRIPTION_PLANS[1].description}
                        </p>
                    </div>

                    <ul className="mb-8 flex-grow space-y-4">
                        {SUBSCRIPTION_PLANS[1].features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                                <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href="/signup"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        Upgrade to {SUBSCRIPTION_PLANS[1].name}
                    </Link>
                </div>

                <div className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                    <div className="mb-8">
                        <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                            Enterprise
                        </span>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-semibold text-foreground">
                                Custom
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Maximum power for global-scale organizations.
                        </p>
                    </div>

                    <ul className="mb-8 flex-grow space-y-4">
                        <li className="flex items-center gap-3 text-sm text-foreground">
                            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                            Unlimited throughput
                        </li>
                        <li className="flex items-center gap-3 text-sm text-foreground">
                            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                            Dedicated Technical Account Manager
                        </li>
                        <li className="flex items-center gap-3 text-sm text-foreground">
                            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                            99.99% uptime SLA
                        </li>
                        <li className="flex items-center gap-3 text-sm text-foreground">
                            <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                            Custom compliance &amp; security review
                        </li>
                    </ul>

                    <Button className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                        Contact Sales
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default Pricing;
