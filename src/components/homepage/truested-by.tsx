import React from "react";

function TrustedBy() {
    return (
        <section className="border-y border-border bg-muted/20 py-12">
            <div className="mx-auto max-w-[1400px] px-container-padding">
                <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Trusted by industry leaders
                </p>

                <div className="flex flex-wrap justify-center gap-12 text-muted-foreground transition-opacity duration-300 hover:opacity-100">
                    {["VERTEX", "NEXUS", "ORBIT", "KINETIC"].map((brand) => (
                        <span
                            key={brand}
                            className="text-3xl font-medium tracking-[0.22em] transition-colors duration-300 hover:text-foreground"
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