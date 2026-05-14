import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: `Privacy Policy — ${siteConfig.name}`,
    description: `How ${siteConfig.name} collects, stores, and uses your data.`,
};

export default function PrivacyPage(): React.ReactElement {
    const updated = "May 2026";

    return (
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-sm text-muted-foreground">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
                <p>Last updated: {updated}</p>
            </div>

            {/* What we collect */}
            <section className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">What we collect</h2>

                <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Account and organisation data</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong>Account data:</strong> your name, email address, and authentication credentials,
                            managed by Better Auth.
                        </li>
                        <li>
                            <strong>Organisation data:</strong> organisation name, slug, and member roles. Every
                            resource in {siteConfig.name} belongs to an organisation; there is no cross-tenant
                            access.
                        </li>
                        <li>
                            <strong>API keys:</strong> we store only the SHA-256 hash and a display prefix of each
                            key you generate. The full key is shown exactly once at creation and is never stored or
                            retrievable by us.
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Resume and job content</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong>Resume files:</strong> the PDF or DOCX you upload, the Markdown we parse from it
                            (<code>original_markdown</code>, immutable after creation), and the structured JSON
                            resume we derive. All are stored in our PostgreSQL database scoped to your organisation.
                        </li>
                        <li>
                            <strong>Tailored resumes:</strong> every version produced by the tailoring pipeline,
                            together with its parent ID, strategy, and refinement statistics.
                        </li>
                        <li>
                            <strong>Job descriptions:</strong> text you supply to tailor a resume. Stored alongside
                            the corresponding tailored resume record.
                        </li>
                        <li>
                            <strong>Cover letters and outreach messages:</strong> AI-generated content linked to
                            tailored resumes. Editable and deletable at any time.
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Billing and usage</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong>Usage records:</strong> timestamped logs of tailoring operations used for
                            metered billing via Polar.sh. Includes operation type, organisation ID, and resume ID.
                        </li>
                        <li>
                            <strong>Subscription data:</strong> your plan tier, status, and billing period, synced
                            from Polar.sh webhooks. Payment method data is held exclusively by Polar.sh as Merchant
                            of Record.
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Technical data</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong>Server logs:</strong> IP addresses and request timestamps, retained for 30 days
                            for security and debugging.
                        </li>
                        <li>
                            <strong>AI provider configuration:</strong> your chosen LLM provider and model name,
                            stored in your configuration. Provider API keys are stored encrypted and are never
                            logged or returned in responses.
                        </li>
                    </ul>
                </div>
            </section>

            {/* How we use it */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">How we use it</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>To provide resume tailoring, cover letter generation, outreach message generation, and PDF export.</li>
                    <li>
                        To send your resume and job description to the AI provider you have configured. Your content
                        is transmitted to that provider&apos;s API and is governed by their terms of service and
                        privacy policy.
                    </li>
                    <li>To meter usage and report it to Polar.sh for billing purposes.</li>
                    <li>We do not sell, share with third parties for advertising, or use your content to train AI models.</li>
                </ul>
            </section>

            {/* Data isolation */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Data isolation</h2>
                <p>
                    {siteConfig.name} uses row-level tenant isolation. Every database record carries an
                    <code className="mx-1 font-mono text-xs bg-muted px-1 py-0.5 rounded">organizationId</code>
                    and every query is scoped to the organisation that owns the API key making the request. No
                    application code path allows cross-tenant reads or writes.
                </p>
            </section>

            {/* Retention */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Data retention</h2>
                <p>
                    Your resume data, cover letters, and outreach messages are retained for as long as your
                    organisation account is active. You can delete individual records at any time via the API or
                    dashboard. Deleting a resume cascades to linked cover letters and outreach messages.
                </p>
                <p>
                    Usage records are retained for billing reconciliation for a minimum of 12 months. Server logs
                    are retained for 30 days.
                </p>
            </section>

            {/* Third parties */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Third-party providers</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                        <strong>AI providers (OpenAI, Anthropic, Google, etc.):</strong> your resume text and job
                        descriptions are transmitted to whichever provider you configure. Review their privacy
                        policies before use.
                    </li>
                    <li>
                        <strong>Polar.sh:</strong> handles subscription management, payments, and metered billing as
                        Merchant of Record.
                    </li>
                    <li>
                        <strong>Neon:</strong> our PostgreSQL database host. Data is stored in encrypted volumes.
                    </li>
                    <li>
                        <strong>Vercel:</strong> our hosting and edge infrastructure provider.
                    </li>
                    <li>
                        <strong>Upstash:</strong> Redis-based rate limiting. Only organisation IDs and request
                        counts are stored; no resume content passes through Upstash.
                    </li>
                </ul>
            </section>

            {/* Contact */}
            <section className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Contact</h2>
                <p>
                    Questions about this policy? Email us at{" "}
                    <a
                        href={`mailto:privacy@${new URL(siteConfig.url).hostname}`}
                        className="text-primary underline underline-offset-4"
                    >
                        privacy@{new URL(siteConfig.url).hostname}
                    </a>
                    .
                </p>
            </section>
        </main>
    );
}