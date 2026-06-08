import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: `Terms of Service — ${siteConfig.name}`,
    description: `Terms of service for the ${siteConfig.name} API platform.`,
};

export default function TermsPage(): React.ReactElement {
    const updated = "May 2026";

    return (
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-sm text-muted-foreground">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
                <p>Last updated: {updated}</p>
            </div>

            {/* Acceptance */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Acceptance</h2>
                <p>
                    By creating an account, generating an API key, or using {siteConfig.name} in any way,
                    you agree to these terms on behalf of yourself and the organisation you represent. If
                    you do not agree, do not use the service.
                </p>
            </section>

            {/* Who can use it */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Eligibility</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>You must be at least 16 years old.</li>
                    <li>
                        You must have the authority to bind your organisation to these terms if you are
                        registering on its behalf.
                    </li>
                    <li>The service is not available in jurisdictions where its use would be prohibited by law.</li>
                </ul>
            </section>

            {/* API access */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">API access and API keys</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                        {siteConfig.name} is an API-first product. Access is granted via API keys scoped to
                        your organisation.
                    </li>
                    <li>
                        You are responsible for keeping your API keys confidential. Do not commit them to
                        source control or share them with unauthorised parties.
                    </li>
                    <li>
                        Any activity performed with your key is your responsibility, regardless of whether
                        you authorised it.
                    </li>
                    <li>Revoke compromised keys immediately from your organisation dashboard.</li>
                </ul>
            </section>

            {/* Acceptable use */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>Use the API only for lawful purposes and in accordance with these terms.</li>
                    <li>
                        Do not upload content belonging to others without authorisation, including confidential
                        employer documents or third-party personal data.
                    </li>
                    <li>Do not attempt to reverse-engineer, probe, or circumvent rate limits or security controls.</li>
                    <li>
                        Do not use the service to generate fraudulent resumes — content that misrepresents
                        skills, employment history, qualifications, or identity.
                    </li>
                </ul>
            </section>

            {/* Your content */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Your content</h2>
                <p>
                    You retain ownership of the resume content you upload. By using {siteConfig.name},
                    you grant us a limited, non-exclusive, non-transferable licence to process and store
                    your content solely to provide the service.
                </p>
                <p>
                    {siteConfig.name} is a tool. You are responsible for reviewing all AI-generated output
                    before submitting any resume or cover letter to an employer. We make no representation
                    that AI suggestions are accurate, complete, or appropriate for any particular role.
                </p>
            </section>

            {/* Plans and billing */}
            <section className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Plans, usage, and billing</h2>

                <p>
                    Billing is managed by Polar.sh as Merchant of Record. By subscribing, you agree to
                    Polar.sh&apos;s terms of service in addition to these terms.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg overflow-hidden text-xs">
                        <thead>
                            <tr className="bg-muted/50 text-foreground text-left">
                                {["Plan", "Price", "Tailor calls / month", "Overage", "Rate limit"].map((h) => (
                                    <th key={h} className="px-3 py-2.5 font-semibold uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                { plan: "Free", price: "$0", calls: "10", overage: "—", rate: "1 / min" },
                                { plan: "Starter", price: "$29 / mo", calls: "200", overage: "$0.15 / call", rate: "20 / min" },
                                { plan: "Pro", price: "$99 / mo", calls: "1 000", overage: "$0.10 / call", rate: "60 / min" },
                                { plan: "Enterprise", price: "Custom", calls: "Unlimited (contracted)", overage: "Volume pricing", rate: "Custom" },
                            ].map((row) => (
                                <tr key={row.plan} className="text-muted-foreground">
                                    <td className="px-3 py-2.5 font-medium text-foreground">{row.plan}</td>
                                    <td className="px-3 py-2.5">{row.price}</td>
                                    <td className="px-3 py-2.5">{row.calls}</td>
                                    <td className="px-3 py-2.5">{row.overage}</td>
                                    <td className="px-3 py-2.5">{row.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                        <strong>Metered operation:</strong> each call to{" "}
                        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">POST /api/v1/resumes/{"{"}id{"}"}/tailor</code>{" "}
                        consumes one unit of your monthly allowance, whether the pipeline succeeds or fails,
                        because every call incurs LLM API costs.
                    </li>
                    <li>
                        <strong>PDF exports and read operations</strong> (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">GET</code> endpoints) are included in all plans and do not count toward your tailor quota.
                    </li>
                    <li>
                        <strong>Free tier hard limit:</strong> the Free plan is capped at 10 tailor calls per calendar month; overages are not available and requests will return HTTP 429 once the limit is reached.
                    </li>
                    <li>
                        <strong>Paid plan overages:</strong> calls beyond your monthly allocation are charged at
                        the per-call overage rate for your plan and invoiced at the end of your billing period.
                    </li>
                    <li>
                        Subscription status is the authoritative source for plan access. Downgrading or cancelling
                        takes effect at the end of the current billing period.
                    </li>
                </ul>
            </section>

            {/* Rate limits */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Rate limits</h2>
                <p>
                    Rate limits are enforced per organisation using a sliding-window algorithm. Exceeding the
                    limit returns HTTP 429 with a{" "}
                    <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Retry-After</code> header
                    indicating when you may retry. Programmatic circumvention of rate limits (e.g., distributing
                    requests across multiple keys to bypass per-org limits) is a violation of these terms.
                </p>
            </section>

            {/* Data isolation */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Multi-tenancy and data isolation</h2>
                <p>
                    All data is isolated at the organisation level. {siteConfig.name} uses row-level isolation;
                    no application code path exposes one organisation&apos;s data to another. Database-per-tenant
                    isolation is not offered in the current version.
                </p>
            </section>

            {/* Termination */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Termination</h2>
                <p>
                    We may suspend or terminate access if you violate these terms or engage in activity that
                    poses a security risk to other organisations on the platform. You may delete your
                    organisation account at any time from the dashboard; all associated data will be removed.
                </p>
            </section>

            {/* Disclaimer */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Disclaimer and limitation of liability</h2>
                <p>
                    {siteConfig.name} is provided &quot;as is&quot; without warranties of any kind, express or
                    implied. We are not responsible for the accuracy of AI-generated resume content, the outcome
                    of job applications made using our service, or any losses arising from API downtime or errors.
                    Our aggregate liability to you shall not exceed the amounts you paid to us in the three months
                    preceding the claim.
                </p>
            </section>

            {/* Changes */}
            <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Changes to these terms</h2>
                <p>
                    We may update these terms from time to time. Material changes will be communicated by email
                    to your account address at least 14 days before they take effect. Continued use after the
                    effective date constitutes acceptance.
                </p>
            </section>

            {/* Contact */}
            <section className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">Contact</h2>
                <p>
                    Legal questions? Email us at{" "}
                    <a
                        href={`mailto:legal@${new URL(siteConfig.url).hostname}`}
                        className="text-primary underline underline-offset-4"
                    >
                        legal@{new URL(siteConfig.url).hostname}
                    </a>
                    .
                </p>
            </section>
        </main>
    );
}