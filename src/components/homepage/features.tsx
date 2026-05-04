import {
    LanguagesIcon,
    Network,
    Sparkles,
    Terminal,
    TrendingUp,
    WifiSyncIcon,
} from "lucide-react";
import React from "react";

function Features() {
    return (
        <>
            <section className="mx-auto max-w-[1400px] px-container-padding py-24">
                <div className="mb-16">
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        Built for speed.
                    </h2>
                    <p className="max-w-xl text-lg text-muted-foreground">
                        Ship world-class software without the infrastructure overhead.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            <Network className="h-5 w-5" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            API First
                        </h3>
                        <p className="text-base text-muted-foreground">
                            Comprehensive REST and GraphQL APIs that put developers first.
                            Integrate in minutes, not days.
                        </p>
                    </div>

                    <div className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            <LanguagesIcon className="h-5 w-5" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            Edge Ready
                        </h3>
                        <p className="text-base text-muted-foreground">
                            Deploy your logic globally to 200+ edge locations for sub-50ms
                            latency everywhere on earth.
                        </p>
                    </div>

                    <div className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            <WifiSyncIcon className="h-5 w-5" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            Real-time Sync
                        </h3>
                        <p className="text-base text-muted-foreground">
                            Automatic state synchronization with conflict resolution built in.
                            Your users are never out of sync.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[1400px] px-container-padding py-12">
                <div className="grid h-full grid-cols-1 gap-4 md:h-[600px] md:grid-cols-4 md:grid-rows-2">
                    <div className="group relative overflow-hidden rounded-3xl bg-primary p-12 text-primary-foreground md:col-span-2 md:row-span-2 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
                        <div className="absolute inset-0 pointer-events-none transition-transform duration-700 group-hover:scale-105">
                            <img
                                alt="Abstract background"
                                className="h-full w-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB23OtyeFYNlTerFIOkee4Gc9MHDewTPkLws6cEErK3GNeyKS9k99WoMYq9fgSmscxAVRoRDGAnJQB3ItjYRRt3ZEx7L1TEhXWkAH84AeEVuxv95huUvXMSI1wfroNhPLsyeBn0y-MzzNgO2vlwulAAzwB6uxEgFUukKdUA1AR0CQ6xw2lN5HDWuhH5JbvGpNAxnqSMZgpL4IrzwGPtkEeVzcC4pt14BDW7mkdQjOx3zU3e_HFBEv_UByvqDIYkZ4yRhIm31Yg1LUB4"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
                        <h3 className="relative z-10 mb-3 text-2xl font-semibold">
                            Advanced Security
                        </h3>
                        <p className="relative z-10 max-w-xs text-base text-primary-foreground/80">
                            Enterprise-grade encryption and compliance out of the box.
                        </p>
                    </div>

                    <div className="flex items-center justify-between overflow-hidden rounded-3xl border border-border bg-muted/50 p-8 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 md:col-span-2">
                        <div>
                            <h4 className="mb-2 text-xl font-medium text-foreground">
                                Unlimited Scale
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                From 1 to 100M+ requests without breaking a sweat.
                            </p>
                        </div>
                        <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-transform duration-500 rotate-12 group-hover:rotate-0">
                            <TrendingUp className="h-12 w-12 text-primary" />
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-3xl border border-border bg-accent/50 p-8 transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h4 className="text-lg font-medium text-foreground">
                            AI Powered Metrics
                        </h4>
                    </div>

                    <div className="flex flex-col justify-between rounded-3xl bg-foreground p-8 text-background transition-all duration-300 hover:shadow-md">
                        <Terminal className="h-6 w-6 text-background" />
                        <h4 className="text-lg font-medium">CLI Built for Speed</h4>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Features;