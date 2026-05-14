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
                    Simple, metered pricing.
                </h2>
                <p className="text-lg text-muted-foreground">
                    Pay for tailor calls. PDF exports and reads are always free.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isPopular = plan.id === "PRO";
                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isPopular
                                ? "border-2 border-primary shadow-xl shadow-primary/10"
                                : "border-border bg-card"
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${isPopular
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-foreground"
                                        }`}
                                >
                                    {plan.name}
                                </span>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-semibold text-foreground">
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-sm text-muted-foreground">
                                            {plan.period}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="mb-8 flex-grow space-y-4">
                                {plan.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-3 text-sm text-foreground"
                                    >
                                        <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                {plan.id === "ENTERPRISE" ? (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full rounded-xl px-4 py-3 text-sm font-semibold"
                                    >
                                        <Link href="/contact">Contact sales</Link>
                                    </Button>
                                ) : (
                                    <Link
                                        href="/sign-up"
                                        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isPopular
                                            ? "bg-primary text-primary-foreground hover:opacity-90"
                                            : "border border-border text-foreground hover:bg-accent"
                                            }`}
                                    >
                                        {plan.id === "FREE"
                                            ? "Get your API key"
                                            : `Upgrade to ${plan.name}`}
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Billing footnote */}
            <p className="mt-10 text-center text-xs text-muted-foreground">
                Tailor calls are metered per request — billed even when the pipeline fails, because
                every call triggers LLM API costs. Reads and PDF exports are always included.
                Billed via{" "}
                <span className="font-medium text-foreground">Polar.sh</span>.
            </p>
        </section>
    );
}

export default Pricing;