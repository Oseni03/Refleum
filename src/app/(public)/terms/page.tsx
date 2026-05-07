import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: `Terms of Service — ${siteConfig.name}` };

export default function TermsPage(): React.ReactElement {
    const updated = "May 2025";
    return (
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-sm text-muted-foreground">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
                <p>Last updated: {updated}</p>
            </div>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Acceptance</h2>
                <p>
                    By creating an account or using {siteConfig.name}, you agree to these terms. If you don&apos;t
                    agree, please do not use the service.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Use of the service</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>You must be 16 years or older to use {siteConfig.name}.</li>
                    <li>You are responsible for the content you upload. Do not upload confidential information belonging to others.</li>
                    <li>You may not use the service for illegal purposes or to harass others.</li>
                    <li>Your API key is your responsibility. Do not share it with others.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Your content</h2>
                <p>
                    You own the resume content you upload. By using {siteConfig.name}, you grant us a limited
                    license to process and store it for the purpose of providing the service.
                </p>
                <p>
                    {siteConfig.name} is a tool — the accuracy of AI-generated suggestions is your
                    responsibility to verify before submitting a resume to any employer.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Usage & Billing</h2>
                <p>
                    {siteConfig.name} uses metered billing for specific AI operations including resume tailoring
                    and PDF exports. Usage is tracked at the organization level. Current rates and included
                    quotas for FREE, STARTER, PRO, and ENTERPRISE plans are detailed on our pricing page and
                    managed via Polar.sh.
                </p>
                <p>
                    Overages or usage beyond included quotas will be billed according to the metered rates
                    associated with your chosen plan.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Disclaimer</h2>
                <p>
                    {siteConfig.name} is provided &quot;as is&quot; without warranties of any kind. We are not
                    responsible for the outcome of job applications made using resumes generated with our
                    service.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Contact</h2>
                <p>Questions? Email us at legal@{new URL(siteConfig.url).hostname}.</p>
            </section>
        </main>
    );
}