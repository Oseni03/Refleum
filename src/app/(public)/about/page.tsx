import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: `About — ${siteConfig.name}`,
    description: siteConfig.description,
};

export default function AboutPage(): React.ReactElement {
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground">{siteConfig.name}</h1>
                <p className="text-lg text-muted-foreground">{siteConfig.tagline}</p>
                <p className="text-muted-foreground">{siteConfig.description}</p>
            </div>

            {/* What we do */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">What we do</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                    {siteConfig.features.map((feature) => (
                        <div
                            key={feature.title}
                            className="space-y-1.5 p-4 rounded-lg border border-border bg-card"
                        >
                            <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* How it works */}
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
                <ol className="space-y-3 text-sm text-muted-foreground list-none">
                    {[
                        {
                            step: "1",
                            title: "Upload your resume",
                            body: "Upload a PDF or DOCX. Refleum converts it to structured JSON and designates it as your master resume — the single source of truth for all tailoring.",
                        },
                        {
                            step: "2",
                            title: "Paste a job description",
                            body: "Send a job description to the tailor endpoint. Refleum extracts keywords, generates targeted diffs, and runs a multi-pass refinement — keyword injection, AI-phrase removal, and alignment validation.",
                        },
                        {
                            step: "3",
                            title: "Receive a tailored resume",
                            body: "Get back a structured JSON resume, refinement stats, an optional cover letter, and an optional outreach message — all in a single API call.",
                        },
                        {
                            step: "4",
                            title: "Export as PDF",
                            body: "Render any resume or cover letter to a pixel-perfect PDF via the export endpoint. A4 or Letter, multiple templates, fully customisable margins and typography.",
                        },
                    ].map(({ step, title, body }) => (
                        <li key={step} className="flex gap-4">
                            <span className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                                {step}
                            </span>
                            <div className="space-y-0.5">
                                <p className="font-semibold text-foreground">{title}</p>
                                <p>{body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            {/* API-first */}
            <div className="space-y-3 text-sm text-muted-foreground border border-border rounded-lg p-6 bg-card">
                <h2 className="text-lg font-semibold text-foreground">Built for developers</h2>
                <p>
                    Refleum is an API-first product. There is no bundled end-user UI — every capability
                    is a REST endpoint authenticated by a per-organisation API key. You bring your own
                    frontend and your own users.
                </p>
                <p>
                    Organisations are isolated at the row level. Every resume, cover letter, outreach
                    message, and usage record belongs to exactly one organisation and is never accessible
                    to another, regardless of plan.
                </p>
                <p>
                    Multiple keys per organisation, immediate revocation, one-time reveal on creation —
                    key management is built in from day one.
                </p>
            </div>

            {/* Our commitment */}
            <div className="space-y-3 text-sm text-muted-foreground">
                <h2 className="text-2xl font-semibold text-foreground">Our commitment</h2>
                <p>
                    {siteConfig.name} is built on a single principle: your resume must reflect your actual
                    experience. Our AI never invents skills, employers, certifications, or metrics. Every
                    change is grounded in what you have already told us — we only help you say it better,
                    and our alignment validator automatically removes any fabricated content before it
                    reaches you.
                </p>
                <p>
                    We support multiple AI providers — OpenAI, Anthropic, Google Gemini, OpenRouter,
                    DeepSeek, and local models via Ollama — so you choose the model that fits your needs
                    and cost targets.
                </p>
            </div>
        </main>
    );
}