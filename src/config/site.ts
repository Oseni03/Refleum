export const siteConfig = {
    name: "Refleum AI",
    description: "An API-first AI Resume Builder platform.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    links: {
        x: "https://x.com/Oseni03",
        linkedin: "https://linkedin.com/in/Oseni03",
        github: "https://github.com/Oseni03",
    },
    logoUrl: "/logo.png",

    tagline: "Programmatic AI-powered resume tailoring.",

    features: [
        {
            title: "API-First Architecture",
            description: "Built for developers. Automate resume parsing, tailoring, and generation via robust REST endpoints.",
        },
        {
            title: "Smart Resume Parsing",
            description: "Upload PDF or DOCX — the system extracts and structures your resume automatically via API.",
        },
        {
            title: "AI-Powered Tailoring API",
            description: "Three tailoring modes (Light nudge, Keyword enhance, Full tailor) adapt your resume to any job in seconds via endpoint.",
        },
        {
            title: "Diff-Based Patching",
            description: "Changes are surgical and verifiable — no wholesale rewrites, just targeted improvements you can review and accept via API.",
        },
        {
            title: "Multi-Pass Refinement",
            description: "Automatically injects relevant keywords, removes AI buzzwords, and validates all content against your master resume.",
        },
        {
            title: "PDF Export Endpoint",
            description: "Download print-ready PDFs programmatically in multiple templates with full layout control.",
        },
        {
            title: "Metered Billing",
            description: "Pay for what you use. Automated usage tracking for tailoring and PDF exports via Polar.sh.",
        },
        {
            title: "Organization Multi-Tenancy",
            description: "Manage multiple team members and shared API keys under a single organization account.",
        },
    ],
};

export type SiteConfig = typeof siteConfig;
