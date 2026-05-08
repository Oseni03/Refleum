import { ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";
import React from "react";
import { siteConfig } from "@/config/site";

function Hero() {
    return (
        <section className="relative">
            {/* Background glows */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
            </div>

            <div className="mx-auto flex max-w-[1400px] flex-col items-center px-container-padding py-20 text-center md:py-32">
                {/* Badge */}
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground shadow-sm backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    API-first · Now in Public Beta
                </div>

                {/* Headline */}
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
                    Resume tailoring.
                    <span className="block text-primary">One API call away.</span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                    {siteConfig.name} accepts a resume and a job description, and returns a
                    tailored resume, cover letter, and outreach message — grounded strictly in
                    what the candidate already has.
                </p>

                {/* Code pill */}
                <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
                    <Terminal className="h-4 w-4 shrink-0 text-primary" />
                    <code className="text-xs font-mono text-muted-foreground">
                        <span className="text-primary">POST</span>{" "}
                        /api/resumes/tailor
                        {"  "}
                        <span className="opacity-50">→ 201 in &lt; 30 s</span>
                    </code>
                </div>

                {/* CTAs */}
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                    >
                        Get your API key
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/docs"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                        Read the docs
                    </Link>
                    <Link
                        href="/docs/reference"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                        API Reference
                    </Link>
                </div>

                {/* Hero image / dashboard preview */}
                <div className="group relative mt-20 w-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
                    <img
                        alt={`${siteConfig.name} — tailored resume diff view with keyword match stats and refinement breakdown`}
                        className="relative h-auto w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGQqLludo_glX4AYzHiGG5yzrQYJXSxT-1-lPiiJbr9LPWAPY3qQQPqZSric9fWlhxOUxQnwOIKnMcGt63CB13V4PyQPLkxbDXEkcXLO_nJouJG1bPcoYPTcT0uQWbL-oJScxrJDrul0keQJd3wsx0lf9tMknq4PCv8z8Ji5XiT6JvYhKeTXR0lI8U94Y8Soai5imn3faC1zDEd26KOG93f9hRIryzf5hiRov39y8MG1rv04DSkauya8-6ockclJdRqS-wFUxVbCD4"
                    />
                </div>
            </div>
        </section>
    );
}

export default Hero;