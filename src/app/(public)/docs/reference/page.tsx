"use client";

import { siteConfig } from "@/config/site";
import { useState, useEffect, useRef } from "react";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

const METHOD_STYLES: Record<Method, string> = {
    GET: "bg-blue-500/10 text-blue-500",
    POST: "bg-emerald-500/10 text-emerald-600",
    PATCH: "bg-orange-500/10 text-orange-500",
    PUT: "bg-amber-500/10 text-amber-500",
    DELETE: "bg-destructive/10 text-destructive",
};

const NAV_SECTIONS = [
    { id: "authentication", label: "Authentication" },
    { id: "rate-limits", label: "Rate Limits" },
    { id: "resumes", label: "Resumes" },
    { id: "cover-letters", label: "Cover Letters" },
    { id: "outreach", label: "Outreach Messages" },
    { id: "settings", label: "Settings" },
    { id: "health", label: "Health" },
    { id: "tailor-request", label: "Tailor Request Body" },
    { id: "tailor-response", label: "Tailor Response" },
    { id: "errors", label: "Error Responses" },
];

function Endpoint({
    method,
    path,
    description,
    planGate,
}: {
    method: Method;
    path: string;
    description: string;
    planGate?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5 py-4 border-b border-border last:border-0">
            <div className="flex items-center gap-3 flex-wrap">
                <span
                    className={`${METHOD_STYLES[method]} px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide`}
                >
                    {method}
                </span>
                <code className="text-sm font-mono text-foreground">{path}</code>
                {planGate && (
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {planGate}
                    </span>
                )}
            </div>
            <p className="text-sm text-muted-foreground pl-0.5">{description}</p>
        </div>
    );
}

function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="space-y-1 border border-border rounded-lg overflow-hidden scroll-mt-8">
            <div className="bg-muted/50 px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
            </div>
            <div className="px-5 divide-y divide-border">{children}</div>
        </section>
    );
}

function Sidebar({ activeSection }: { activeSection: string }) {
    return (
        <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-8 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2 border-b border-border mb-3">
                    On this page
                </p>
                <nav className="flex flex-col gap-0.5">
                    {NAV_SECTIONS.map(({ id, label }) => (
                        <a
                            key={id}
                            href={`#${id}`}
                            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeSection === id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                        >
                            {label}
                        </a>
                    ))}
                </nav>
            </div>
        </aside>
    );
}

export default function ApiReferencePage(): React.ReactElement {
    const [activeSection, setActiveSection] = useState("authentication");
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const sectionIds = NAV_SECTIONS.map((s) => s.id);

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id);
                }
            },
            {
                rootMargin: "-8px 0px -60% 0px",
                threshold: 0,
            }
        );

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            {/* Header */}
            <div className="space-y-3 mb-12">
                <h1 className="text-4xl font-bold text-foreground">API Reference</h1>
                <p className="text-lg text-muted-foreground">
                    {siteConfig.name} is an API-first platform. Every capability is available as a REST endpoint
                    authenticated by a per-organisation API key. Base URL:{" "}
                    <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">
                        {process.env.NEXT_PUBLIC_APP_URL}/api/v1
                    </code>
                </p>
            </div>

            <div className="flex gap-12 items-start">
                {/* Sidebar */}
                <Sidebar activeSection={activeSection} />

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-12">
                    {/* Authentication */}
                    <div id="authentication" className="space-y-4 scroll-mt-8">
                        <h2 className="text-xl font-semibold text-foreground">Authentication</h2>
                        <p className="text-sm text-muted-foreground">
                            Pass your API key in the{" "}
                            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                Authorization
                            </code>{" "}
                            header on every request. Keys are created and revoked from your organisation
                            dashboard. The <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">organizationId</code> is
                            always derived from your verified key — it is never read from the request body.
                        </p>
                        <pre className="bg-muted text-foreground p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <code>Authorization: Bearer YOUR_API_KEY</code>
                        </pre>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            {[
                                { code: "401", label: "Missing or invalid key" },
                                { code: "403", label: "Plan upgrade required" },
                                { code: "429", label: "Rate limit exceeded" },
                            ].map(({ code, label }) => (
                                <div
                                    key={code}
                                    className="flex items-center gap-2 p-3 rounded-md border border-border bg-card"
                                >
                                    <span className="font-mono font-bold text-foreground">{code}</span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rate limits */}
                    <div id="rate-limits" className="space-y-3 scroll-mt-8">
                        <h2 className="text-xl font-semibold text-foreground">Rate limits</h2>
                        <p className="text-sm text-muted-foreground">
                            Limits are enforced per organisation using a sliding window. Every response
                            includes rate-limit headers:
                        </p>
                        <pre className="bg-muted text-foreground p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            {`X-RateLimit-Limit: 20
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 1715000060
Retry-After: 42   # only on 429`}
                        </pre>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-muted-foreground border border-border rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-muted/50 text-foreground text-left">
                                        {["Plan", "Price / month", "Tailor calls", "Rate limit"].map((h) => (
                                            <th
                                                key={h}
                                                className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[
                                        { plan: "Free", price: "$0", calls: "10 / month", rate: "1 / min" },
                                        { plan: "Starter", price: "$29", calls: "200 / month", rate: "20 / min" },
                                        { plan: "Pro", price: "$99", calls: "1 000 / month", rate: "60 / min" },
                                        { plan: "Enterprise", price: "Custom", calls: "Unlimited", rate: "Custom" },
                                    ].map((row) => (
                                        <tr key={row.plan}>
                                            <td className="px-4 py-2.5 font-medium text-foreground">{row.plan}</td>
                                            <td className="px-4 py-2.5">{row.price}</td>
                                            <td className="px-4 py-2.5">{row.calls}</td>
                                            <td className="px-4 py-2.5">{row.rate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Resumes */}
                    <Section id="resumes" title="Resumes">
                        <Endpoint
                            method="POST"
                            path="/api/v1/resumes"
                            description="Upload a PDF or DOCX (≤ 4 MB) via multipart/form-data. Fields: file (required), set_as_master (boolean, optional). Parses to structured JSON via LLM. Returns resume_id, is_master, status (READY | FAILED), filename."
                        />
                        <Endpoint
                            method="GET"
                            path="/api/v1/resumes"
                            description="List resumes for your organisation, sorted by updated_at desc. Query params: include_master (boolean, default false), limit (max 100, default 10), offset (default 0)."
                        />
                        <Endpoint
                            method="GET"
                            path="/api/v1/resumes/{id}"
                            description="Retrieve a single resume including structured_data, job_keywords, strategy, and parent_id. Returns 404 for IDs belonging to other orgs."
                        />
                        <Endpoint
                            method="PATCH"
                            path="/api/v1/resumes/{id}"
                            description="Manually update resume fields. Body (all optional): title, structuredData, status, filename. No LLM call."
                        />
                        <Endpoint
                            method="DELETE"
                            path="/api/v1/resumes/{id}"
                            description="Delete a resume. Cascades to linked CoverLetter and Outreach records."
                        />
                        <Endpoint
                            method="POST"
                            path="/api/v1/resumes/{id}/tailor"
                            planGate="Starter+"
                            description="Tailor the specified resume to a job description. Runs the full pipeline — keyword extraction, diff generation, safety nets, multi-pass refinement — and persists the result immediately. Hard timeout: 240 s."
                        />
                        <Endpoint
                            method="POST"
                            path="/api/v1/resumes/{id}/retry"
                            description="Re-run LLM parsing on stored original_markdown. Only available when status is FAILED or PROCESSING. Returns 400 INVALID_STATUS otherwise."
                        />
                        <Endpoint
                            method="GET"
                            path="/api/v1/resumes/{id}/pdf"
                            description="Render and download the resume as a PDF (application/pdf). Query params: format (A4 | LETTER, default A4)."
                        />
                    </Section>

                    {/* Cover Letters */}
                    <Section id="cover-letters" title="Cover Letters">
                        <Endpoint
                            method="GET"
                            path="/api/v1/cover-letters"
                            description="List cover letters for your organisation. Query params: resume_id (filter), limit (max 100, default 10), offset (default 0). Cover letters are created at tailor-time or via /regenerate — no standalone POST."
                        />
                        <Endpoint
                            method="GET"
                            path="/api/v1/cover-letters/{id}"
                            description="Retrieve a single cover letter including its full content."
                        />
                        <Endpoint
                            method="PATCH"
                            path="/api/v1/cover-letters/{id}"
                            description='Manually replace cover letter content. Body: { "content": "string (required)" }. No LLM call.'
                        />
                        <Endpoint
                            method="DELETE"
                            path="/api/v1/cover-letters/{id}"
                            description="Delete a cover letter."
                        />
                        <Endpoint
                            method="POST"
                            path="/api/v1/cover-letters/{id}/regenerate"
                            planGate="Starter+"
                            description="Regenerate the cover letter via AI. Body (optional): { job_description: string }. Falls back to the linked resume's stored JD if omitted. Updates the record in place (same ID)."
                        />
                        <Endpoint
                            method="GET"
                            path="/api/v1/cover-letters/{id}/pdf"
                            description="Render and download the cover letter as a PDF. Query params: format (A4 | LETTER, default A4)."
                        />
                    </Section>

                    {/* Outreach */}
                    <Section id="outreach" title="Outreach Messages">
                        <Endpoint
                            method="GET"
                            path="/api/v1/outreach"
                            description="List outreach messages for your organisation. Query params: resume_id (filter), limit (max 100, default 10), offset (default 0). Outreach messages are created at tailor-time or via /regenerate — no standalone POST."
                        />
                        <Endpoint
                            method="GET"
                            path="/api/v1/outreach/{id}"
                            description="Retrieve a single outreach message."
                        />
                        <Endpoint
                            method="PATCH"
                            path="/api/v1/outreach/{id}"
                            description='Manually replace outreach content. Body: { "content": "string (required)" }. No LLM call.'
                        />
                        <Endpoint
                            method="DELETE"
                            path="/api/v1/outreach/{id}"
                            description="Delete an outreach message."
                        />
                        <Endpoint
                            method="POST"
                            path="/api/v1/outreach/{id}/regenerate"
                            planGate="Starter+"
                            description="Regenerate the outreach message via AI. Body (optional): { job_description: string }. Falls back to the linked resume's stored JD if omitted. Updates in place (same ID)."
                        />
                    </Section>

                    {/* Settings */}
                    <Section id="settings" title="Settings">
                        <Endpoint
                            method="GET"
                            path="/api/v1/settings/llm"
                            description="Retrieve the organisation's LLM configuration (API key is masked). Returns: { provider, model, apiKey (masked), apiBase, reasoningEffort, enableCoverLetter, enableOutreachMessage, contentLanguage, defaultPromptId }."
                        />
                        <Endpoint
                            method="PUT"
                            path="/api/v1/settings/llm"
                            description="Update LLM provider, model, API key, and feature flags. Omit a field to leave it unchanged. All fields optional: provider, model, apiKey, apiBase, reasoningEffort (minimal|low|medium|high), enableCoverLetter, enableOutreachMessage, contentLanguage, defaultPromptId."
                        />
                    </Section>

                    {/* Health */}
                    <Section id="health" title="Health">
                        <Endpoint
                            method="GET"
                            path="/api/v1/health"
                            description="Public endpoint — no authentication required. Returns { data: { status: 'ok', db: 'ok' } } (200) or { error: 'INTERNAL_ERROR', detail: 'Database unreachable' } (503). Useful for uptime monitors and deployment smoke tests."
                        />
                    </Section>

                    {/* Tailor request shape */}
                    <div id="tailor-request" className="space-y-3 scroll-mt-8">
                        <h2 className="text-xl font-semibold text-foreground">Tailor request body</h2>
                        <p className="text-sm text-muted-foreground">
                            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">POST /api/v1/resumes/{"{id}"}/tailor</code>
                            {" "}— the <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{"{id}"}</code> path parameter
                            is the source resume to tailor. Content-Type: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">application/json</code>.
                        </p>
                        <pre className="bg-muted text-foreground p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            {`{
  "jobDescription": "string (required, min 50 chars)",
  "strategy": "nudge" | "keywords" | "full",  // default: "nudge"
  "generate_cover_letter": false,              // default: false
  "generate_outreach": false,                  // default: false
  "outputLanguage": "en"                       // BCP-47 language tag, default: "en"
}`}
                        </pre>
                        <div className="rounded-md border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
                            <p><strong className="text-foreground">Strategy guide:</strong>{" "}
                                <code className="font-mono">nudge</code> = minimal edits preserving your voice;{" "}
                                <code className="font-mono">keywords</code> = reword bullets to surface JD keywords;{" "}
                                <code className="font-mono">full</code> = comprehensive rewrite.
                            </p>
                        </div>
                    </div>

                    {/* Tailor response shape */}
                    <div id="tailor-response" className="space-y-3 scroll-mt-8">
                        <h2 className="text-xl font-semibold text-foreground">Tailor response (201)</h2>
                        <pre className="bg-muted text-foreground p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            {`{
  "data": {
    "resume_id": "string",
    "is_master": false,
    "status": "READY",
    "filename": "string",
    "strategy": "keywords",
    "job_keywords": {
      "required_skills": ["string"],
      "preferred_skills": ["string"],
      "keywords": ["string"],
      "key_responsibilities": ["string"],
      "experience_years": 3 | null,
      "seniority_level": "Senior" | null
    },
    "parent_id": "string (source resume ID)",
    "cover_letter_id": "string" | null,
    "outreach_id": "string" | null,
    "refinement_stats": {
      "passes_completed": 3,
      "keywords_injected": 4,
      "ai_phrases_removed": ["leveraged", "spearheaded"],
      "alignment_violations_fixed": 0,
      "initial_match_percentage": 58.3,
      "final_match_percentage": 83.1
    }
  }
}`}
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            A{" "}
                            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">201</code>{" "}
                            is always returned when the pipeline completes, even if some changes were rejected or refinement partially failed.
                            Hard timeout: 240 s — returns <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">504 TIMEOUT</code> if exceeded.
                        </p>
                    </div>

                    {/* Error shape */}
                    <div id="errors" className="space-y-3 scroll-mt-8">
                        <h2 className="text-xl font-semibold text-foreground">Error responses</h2>
                        <p className="text-sm text-muted-foreground">All errors follow a consistent envelope. The <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">detail</code> field is present on validation errors.</p>
                        <pre className="bg-muted text-foreground p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            {`{ "error": "SNAKE_CASE_LITERAL", "detail": "string?" }`}
                        </pre>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-muted-foreground border border-border rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-muted/50 text-foreground text-left">
                                        {["HTTP", "Code", "Meaning"].map((h) => (
                                            <th
                                                key={h}
                                                className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[
                                        ["401", "MISSING_KEY / INVALID_KEY", "API key absent or revoked"],
                                        ["403", "PLAN_REQUIRED", "Endpoint requires a higher plan (Starter+)"],
                                        ["400", "VALIDATION_ERROR", "Missing required field, bad MIME type, or file too large (detail field explains)"],
                                        ["400", "NO_MASTER_RESUME", "No master resume and no id supplied in path"],
                                        ["400", "NO_JOB_DESCRIPTION", "Regenerate called with no JD on the linked resume"],
                                        ["400", "INVALID_INPUT", "Request body failed Zod schema validation"],
                                        ["404", "NOT_FOUND", "Resource not found or belongs to another org"],
                                        ["429", "RATE_LIMITED", "Per-minute sliding window exceeded"],
                                        ["429", "MONTHLY_LIMIT_REACHED", "Free-tier monthly quota exhausted"],
                                        ["504", "TIMEOUT", "Tailoring exceeded 240 s hard limit"],
                                        ["503", "PDF_GENERATION_FAILED", "Headless Chromium render error"],
                                        ["500", "INTERNAL_ERROR", "Unexpected server error"],
                                    ].map(([code, literal, meaning]) => (
                                        <tr key={literal}>
                                            <td className="px-4 py-2.5 font-mono font-bold text-foreground">{code}</td>
                                            <td className="px-4 py-2.5 font-mono text-xs">{literal}</td>
                                            <td className="px-4 py-2.5">{meaning}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}