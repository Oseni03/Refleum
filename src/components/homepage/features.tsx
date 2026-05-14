import {
    FileText,
    Diff,
    Globe2,
    Languages,
    Lock,
    ShieldCheck,
    Sparkles,
    SlidersHorizontal,
} from "lucide-react";
import React from "react";

function Features() {
    return (
        <>
            {/* ── Top feature cards ─────────────────────────────────── */}
            <section id="features" className="mx-auto max-w-[1400px] px-container-padding py-24">
                <div className="mb-16">
                    <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        Built for truthful tailoring.
                    </h2>
                    <p className="max-w-xl text-lg text-muted-foreground">
                        Every change is grounded in what the candidate actually has.
                        The pipeline never fabricates — it only refines.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Card 1 */}
                    <div className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            <Diff className="h-5 w-5" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            Diff-Based Pipeline
                        </h3>
                        <p className="text-base text-muted-foreground">
                            The LLM produces a targeted list of changes — not a full
                            rewrite. Every diff is verified against the original before
                            it applies. Rejected diffs are counted and returned.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            Multi-Pass Refinement
                        </h3>
                        <p className="text-base text-muted-foreground">
                            After tailoring: keyword injection from the master resume,
                            AI-phrase removal (em-dashes, "spearheaded", "leveraged"), and
                            alignment validation — all automatic, all reported in
                            <code className="mx-1 text-xs font-mono">refinement_stats</code>.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            <Lock className="h-5 w-5" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            Org-Level Isolation
                        </h3>
                        <p className="text-base text-muted-foreground">
                            Every resume, cover letter, and usage record belongs to
                            exactly one organisation. Row-level isolation on every table.
                            Cross-tenant access is architecturally impossible.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Bento grid ────────────────────────────────────────── */}
            <section className="mx-auto max-w-[1400px] px-container-padding py-12">
                <div className="grid h-full grid-cols-1 gap-4 md:h-[600px] md:grid-cols-4 md:grid-rows-2">

                    {/* Large hero tile */}
                    <div className="group relative overflow-hidden rounded-3xl bg-primary p-12 text-primary-foreground md:col-span-2 md:row-span-2 flex flex-col justify-end">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
                        <div className="absolute inset-0 pointer-events-none transition-transform duration-700 group-hover:scale-105">
                            <img
                                alt="Resume diff visualisation"
                                className="h-full w-full object-cover opacity-30"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB23OtyeFYNlTerFIOkee4Gc9MHDewTPkLws6cEErK3GNeyKS9k99WoMYq9fgSmscxAVRoRDGAnJQB3ItjYRRt3ZEx7L1TEhXWkAH84AeEVuxv95huUvXMSI1wfroNhPLsyeBn0y-MzzNgO2vlwulAAzwB6uxEgFUukKdUA1AR0CQ6xw2lN5HDWuhH5JbvGpNAxnqSMZgpL4IrzwGPtkEeVzcC4pt14BDW7mkdQjOx3zU3e_HFBEv_UByvqDIYkZ4yRhIm31Yg1LUB4"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
                        <ShieldCheck className="relative z-10 mb-4 h-7 w-7 text-primary-foreground/70" />
                        <h3 className="relative z-10 mb-3 text-2xl font-semibold">
                            Truthfulness Constraint
                        </h3>
                        <p className="relative z-10 max-w-xs text-base text-primary-foreground/80">
                            The alignment validator automatically removes fabricated skills,
                            certifications, and employers before the response reaches you.
                            No invented metrics. No hallucinated employers.
                        </p>
                    </div>

                    {/* Cover letter + outreach */}
                    <div className="flex items-center justify-between overflow-hidden rounded-3xl border border-border bg-muted/50 p-8 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 md:col-span-2">
                        <div>
                            <h4 className="mb-2 text-xl font-medium text-foreground">
                                Cover Letter &amp; Outreach
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Request a cover letter and LinkedIn outreach message in the
                                same tailor call. Generated in parallel, stored separately,
                                regeneratable any time.
                            </p>
                        </div>
                        <div className="ml-6 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                            <FileText className="h-9 w-9 text-primary" />
                        </div>
                    </div>

                    {/* PDF export */}
                    <div className="flex flex-col justify-between rounded-3xl border border-border bg-accent/50 p-8 transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
                        <Globe2 className="h-6 w-6 text-primary" />
                        <div>
                            <h4 className="text-lg font-medium text-foreground">
                                PDF Export
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                                A4 or Letter, multiple templates, custom margins and fonts —
                                rendered by headless Chromium.
                            </p>
                        </div>
                    </div>

                    {/* Multi-language */}
                    <div className="flex flex-col justify-between rounded-3xl bg-foreground p-8 text-background transition-all duration-300 hover:shadow-md">
                        <Languages className="h-6 w-6 text-background/70" />
                        <div>
                            <h4 className="text-lg font-medium">5 Languages</h4>
                            <p className="mt-1 text-xs text-background/60">
                                EN · ES · ZH · JA · PT — specify per request.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pipeline step strip ───────────────────────────────── */}
            <section className="mx-auto max-w-[1400px] px-container-padding py-16">
                <div className="rounded-3xl border border-border bg-card p-10">
                    <p className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        What happens in a single tailor call
                    </p>
                    <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                n: "01",
                                icon: <Sparkles className="h-4 w-4" />,
                                title: "Keyword extraction",
                                body: "Required skills, preferred skills, responsibilities, and seniority parsed from the JD.",
                            },
                            {
                                n: "02",
                                icon: <Diff className="h-4 w-4" />,
                                title: "Diff generation",
                                body: "LLM outputs a targeted change list — paths, actions, original text, and reasons.",
                            },
                            {
                                n: "03",
                                icon: <ShieldCheck className="h-4 w-4" />,
                                title: "Safety nets",
                                body: "personalInfo locked, dates restored, dropped skills re-appended, custom sections protected.",
                            },
                            {
                                n: "04",
                                icon: <SlidersHorizontal className="h-4 w-4" />,
                                title: "Multi-pass refinement",
                                body: "Keyword injection → AI-phrase removal → alignment validation. Stats returned.",
                            },
                        ].map(({ n, icon, title, body }) => (
                            <li key={n} className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        {icon}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground">{n}</span>
                                </div>
                                <h4 className="font-semibold text-foreground">{title}</h4>
                                <p className="text-sm text-muted-foreground">{body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        </>
    );
}

export default Features;