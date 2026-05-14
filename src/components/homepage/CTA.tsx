import Link from "next/link";
import React from "react";

function CTA() {
    return (
        <section className="mx-auto max-w-[1400px] px-container-padding py-24">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 text-center shadow-lg shadow-primary/5 md:p-24">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary/10),transparent_45%)]" />
                <div className="relative z-10">
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        Ready to transform your dev workflow?
                    </h2>
                    <p className="mx-auto mb-10 max-w-xl text-muted-foreground">
                        Join thousands of teams shipping faster with a production-ready foundation.
                    </p>

                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                        >
                            Start building
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-8 py-4 text-lg font-semibold text-foreground transition-colors duration-300 hover:bg-accent"
                        >
                            Talk to us
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTA;