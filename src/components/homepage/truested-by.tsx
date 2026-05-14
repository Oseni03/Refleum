import React from "react";

// Replace these with real customer logos / names once available.
// Each entry renders as a wordmark in the "trusted by" strip.
const CUSTOMERS = ["VERIDIA", "NEXHIRE", "STACKFORM", "CREWLY", "TALENTFLOW"] as const;

function TrustedBy() {
    return (
        <section className="border-y border-border bg-muted/20 py-12">
            <div className="mx-auto max-w-[1400px] px-container-padding">
                <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Powering job-search products at
                </p>

                <div className="flex flex-wrap justify-center gap-12 text-muted-foreground">
                    {CUSTOMERS.map((brand) => (
                        <span
                            key={brand}
                            className="text-2xl font-medium tracking-[0.22em] transition-colors duration-300 hover:text-foreground"
                        >
                            {brand}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TrustedBy;