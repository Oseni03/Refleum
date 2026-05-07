import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: `Privacy Policy — ${siteConfig.name}` };

export default function PrivacyPage(): React.ReactElement {
    const updated = "May 2025";
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-sm text-muted-foreground">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
                <p>Last updated: {updated}</p>
            </div>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">What we collect</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Account data:</strong> name, email address, and authentication credentials managed by Better Auth.</li>
                    <li><strong>Organization data:</strong> organization name, slug, and membership roles. Every resource is scoped to an organization.</li>
                    <li><strong>API Keys:</strong> keys you generate for programmatic access. We only store hashes/prefixes; the full key is not retrievable.</li>
                    <li><strong>Usage Records:</strong> timestamped logs of tailoring and PDF export events used for metered billing.</li>
                    <li><strong>Resume content:</strong> the PDF/DOCX you upload and the structured JSON we parse from it. Stored in our PostgreSQL database, associated with your organization.</li>
                    <li><strong>Job descriptions:</strong> text you paste to tailor your resume. Stored alongside your resume records.</li>
                    <li><strong>AI configuration:</strong> your chosen LLM provider, model name, and API key (stored encrypted). We never read or log your API key beyond storing it for your requests.</li>
                    <li><strong>Usage data:</strong> standard server logs (IP address, request timestamps) for security and debugging, retained for 30 days.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">How we use it</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>To provide the resume tailoring, enrichment, and cover letter features you requested.</li>
                    <li>To send your resume and job description to the LLM provider you configured. Your data is sent to the provider&apos;s API under their terms of service.</li>
                    <li>We do not sell, share, or use your data to train AI models.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Data retention</h2>
                <p>Your resume data is retained as long as your account is active. You can delete individual resumes or your entire account at any time from the dashboard.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Third-party providers</h2>
                <p>
                    {siteConfig.name} forwards your resume and job description text to the AI provider you
                    configure (OpenAI, Anthropic, Google, etc.). Each provider&apos;s privacy policy governs
                    how they handle that data. We recommend reviewing their policies before use.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Contact</h2>
                <p>Questions? Email us at privacy@{new URL(siteConfig.url).hostname}.</p>
            </section>
        </main>
    );
}