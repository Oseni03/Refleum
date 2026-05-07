import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: `About — ${siteConfig.name}`,
    description: siteConfig.description,
};

export default function AboutPage(): React.ReactElement {
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground">{siteConfig.name}</h1>
                <p className="text-lg text-muted-foreground">{siteConfig.tagline}</p>
                <p className="text-muted-foreground">{siteConfig.description}</p>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">What we do</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                    {siteConfig.features.map((feature) => (
                        <div key={feature.title} className="space-y-1.5 p-4 rounded-lg border border-border bg-card">
                            <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
                <h2 className="text-2xl font-semibold text-foreground">Our commitment</h2>
                <p>
                    {siteConfig.name} is built on a single principle: your resume should reflect your actual
                    experience. Our AI never invents skills, companies, metrics, or responsibilities. Every
                    change is grounded in what you&apos;ve already told us — we only help you say it better.
                </p>
                <p>
                    We support multiple AI providers (OpenAI, Anthropic, Google Gemini, and local models via
                    Ollama) so you can choose the model that best fits your needs and budget.
                </p>
            </div>
        </main>
    );
}

// ─── Privacy Page ──────────────────────────────────────────────────────────────
// src/app/(public)/privacy/page.tsx — save separately if preferred

// ─── Terms Page ────────────────────────────────────────────────────────────────
// src/app/(public)/terms/page.tsx — save separately if preferred
