"use client";

import { useState, useEffect } from "react";
import Playground from "@/components/docs/playground";
import SectionHeader from "@/components/docs/section-header";

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV = [
    {
        group: "Getting Started",
        items: [
            { id: "overview", label: "Overview" },
            { id: "quickstart", label: "Quickstart" },
            { id: "authentication", label: "Authentication" },
            { id: "rate-limits", label: "Rate Limits & Plans" },
            { id: "errors", label: "Error Responses" },
        ],
    },
    {
        group: "Resumes",
        items: [
            { id: "resume-upload", label: "Upload Resume" },
            { id: "resume-list", label: "List Resumes" },
            { id: "resume-get", label: "Get Resume" },
            { id: "resume-patch", label: "Update Resume" },
            { id: "resume-delete", label: "Delete Resume" },
            { id: "resume-tailor", label: "Tailor Resume" },
            { id: "resume-retry", label: "Retry Parsing" },
            { id: "resume-pdf", label: "Export PDF" },
        ],
    },
    {
        group: "Cover Letters",
        items: [
            { id: "cl-list", label: "List Cover Letters" },
            { id: "cl-generate", label: "Generate Cover Letter" },
            { id: "cl-get", label: "Get Cover Letter" },
            { id: "cl-delete", label: "Delete Cover Letter" },
            { id: "cl-regenerate", label: "Regenerate" },
        ],
    },
    {
        group: "Outreach",
        items: [
            { id: "out-list", label: "List Outreach" },
            { id: "out-generate", label: "Generate Outreach" },
            { id: "out-get", label: "Get Outreach" },
            { id: "out-delete", label: "Delete Outreach" },
            { id: "out-regenerate", label: "Regenerate" },
        ],
    },
    {
        group: "Settings & Health",
        items: [
            { id: "settings-llm", label: "LLM Settings" },
            { id: "health", label: "Health Check" },
        ],
    },
    {
        group: "Data Models",
        items: [
            { id: "model-resume", label: "ResumeData" },
            { id: "model-keywords", label: "JobKeywords" },
            { id: "model-refinement", label: "RefinementStats" },
        ],
    },
];

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-[#0d0d0d]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{language}</span>
                <button
                    onClick={copy}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    {copied ? "Copied ✓" : "Copy"}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-zinc-200 leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function ParamRow({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
    return (
        <tr className="border-b border-border last:border-0">
            <td className="py-2.5 pr-4 align-top">
                <code className="text-xs font-mono text-foreground">{name}</code>
                {required && <span className="ml-1.5 text-[10px] text-red-400 font-medium">required</span>}
            </td>
            <td className="py-2.5 pr-4 align-top">
                <span className="text-xs font-mono text-violet-400">{type}</span>
            </td>
            <td className="py-2.5 text-xs text-muted-foreground">{desc}</td>
        </tr>
    );
}

export default function DocsPage(): React.ReactElement {
    const [activeSection, setActiveSection] = useState("overview");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        const allIds = NAV.flatMap((g) => g.items.map((i) => i.id)).concat(["playground"]);
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length) setActiveSection(visible[0].target.id);
            },
            { rootMargin: "-10px 0px -65% 0px", threshold: 0 }
        );
        allIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile nav toggle */}
            <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur border-b border-border">
                <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <span className="text-sm font-semibold text-foreground">Docs</span>
                <span className="text-xs text-muted-foreground">— {activeSection}</span>
            </div>

            <div className="max-w-7xl mx-auto flex">
                {/* Sidebar */}
                <aside className={`${mobileNavOpen ? "block" : "hidden"} lg:block w-60 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border py-8 px-3`}>
                    <div className="px-3 mb-6">
                        <h1 className="text-base font-bold text-foreground">API Reference</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">v2.2 · REST · JSON</p>
                    </div>

                    {/* Playground link */}
                    <a
                        href="#playground"
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm mb-4 transition-colors font-medium ${activeSection === "playground" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                        onClick={() => setMobileNavOpen(false)}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        API Playground
                    </a>

                    <nav className="space-y-5">
                        {NAV.map((group) => (
                            <div key={group.group}>
                                <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em]">
                                    {group.group}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={() => setMobileNavOpen(false)}
                                            className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${activeSection === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main */}
                <main className="flex-1 min-w-0 px-6 lg:px-10 py-10 space-y-16">

                    {/* ── OVERVIEW ── */}
                    <section id="overview" className="scroll-mt-6 space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-foreground">Refleum API</h1>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">v2.2</span>
                            </div>
                            <p className="text-muted-foreground">
                                An API-first SaaS that enables developers to build resume tailoring workflows into their own products.
                                Upload a resume, pass a job description, and receive a tailored resume, cover letter, and outreach message — all
                                grounded strictly in the original resume content. No fabricated skills, no invented metrics.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { label: "Base URL", value: process.env.NEXT_PUBLIC_API_URL },
                                { label: "Protocol", value: "REST over HTTPS" },
                                { label: "Response Format", value: "application/json" },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-4 rounded-xl border border-border bg-card">
                                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                    <code className="text-sm font-mono text-foreground">{value}</code>
                                </div>
                            ))}
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { icon: "🔑", title: "API-key auth", desc: "Per-org keys, revocable any time" },
                                { icon: "🏢", title: "Multi-tenant", desc: "All data scoped to your organization" },
                                { icon: "🤖", title: "Truthful AI", desc: "Never fabricates skills or experience" },
                                { icon: "⚡", title: "Single-step", desc: "One request in, complete response out" },
                            ].map(({ icon, title, desc }) => (
                                <div key={title} className="p-4 rounded-xl border border-border bg-card space-y-1">
                                    <div className="text-xl">{icon}</div>
                                    <p className="text-sm font-medium text-foreground">{title}</p>
                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── QUICKSTART ── */}
                    <section id="quickstart" className="scroll-mt-6 space-y-5">
                        <h2 className="text-2xl font-bold text-foreground">Quickstart</h2>
                        <p className="text-muted-foreground text-sm">Get your first tailored resume in 3 API calls.</p>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">1</div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-medium text-foreground">Upload your resume</p>
                                    <CodeBlock language="bash" code={`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL}/api/v1/resumes \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@resume.pdf" \\
  -F "set_as_master=true"`} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">2</div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-medium text-foreground">Tailor to a job description</p>
                                    <CodeBlock language="bash" code={`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL}/api/v1/resumes/{resume_id}/tailor \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jobDescription": "We are looking for a Senior Software Engineer...",
    "strategy": "keywords",
    "generate_cover_letter": true
  }'`} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-none w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">3</div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-medium text-foreground">Download the tailored PDF</p>
                                    <CodeBlock language="bash" code={`curl ${process.env.NEXT_PUBLIC_APP_URL}/api/v1/resumes/{resume_id}/pdf \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  --output tailored_resume.pdf`} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── AUTHENTICATION ── */}
                    <section id="authentication" className="scroll-mt-6 space-y-5">
                        <h2 className="text-2xl font-bold text-foreground">Authentication</h2>
                        <p className="text-sm text-muted-foreground">
                            All endpoints require a valid organization API key passed in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">Authorization</code> header or the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">x-api-key</code> header.
                            Keys are created and revoked from your organization dashboard. Each key is hashed (SHA-256) and shown only once at creation.
                        </p>
                        <CodeBlock language="http" code={`Authorization: Bearer sk_live_••••••••••••••••
x-api-key: sk_live_••••••••••••••••`} />
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400">
                            <strong>Security note:</strong> The <code className="text-xs font-mono">organizationId</code> is always derived from your verified API key — it is never read from the request body. A leaked key must never impersonate a session.
                        </div>
                    </section>

                    {/* ── RATE LIMITS ── */}
                    <section id="rate-limits" className="scroll-mt-6 space-y-5">
                        <h2 className="text-2xl font-bold text-foreground">Rate Limits & Plans</h2>
                        <p className="text-sm text-muted-foreground">Limits are enforced per organization using a sliding window via Upstash Redis. Every response includes rate-limit headers.</p>
                        <CodeBlock language="http" code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1748400060
Retry-After: 42   # only present on 429`} />
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>{["Plan", "Price / mo", "Tailor calls", "Rate limit", "Features"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[
                                        ["Free", "$0", "10 / month", "1 / min", "Upload, CRUD, PDF export"],
                                        ["Starter", "$29", "200 / month", "20 / min", "+ Tailoring, cover letters, outreach"],
                                        ["Pro", "$99", "1,000 / month", "60 / min", "+ Parallel generation, multi-language"],
                                        ["Enterprise", "Custom", "Unlimited", "Custom", "+ Custom rate limits, SLA, isolation"],
                                    ].map(([plan, price, calls, rate, features]) => (
                                        <tr key={plan}>
                                            <td className="px-4 py-3 font-medium text-foreground">{plan}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{price}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{calls}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{rate}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{features}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── ERRORS ── */}
                    <section id="errors" className="scroll-mt-6 space-y-5">
                        <h2 className="text-2xl font-bold text-foreground">Error Responses</h2>
                        <p className="text-sm text-muted-foreground">All errors share a consistent envelope. The <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">detail</code> field is present on validation errors.</p>
                        <CodeBlock language="json" code={`{ "error": "SNAKE_CASE_LITERAL", "detail": "string?" }`} />
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>{["HTTP", "Code", "Meaning"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[
                                        ["401", "MISSING_KEY / INVALID_KEY", "API key missing or invalid"],
                                        ["401", "UNAUTHORIZED", "Authentication failed"],
                                        ["403", "PLAN_REQUIRED", "Endpoint requires Starter+ plan"],
                                        ["400", "VALIDATION_ERROR", "Body or query validation failed"],
                                        ["400", "NO_MASTER_RESUME", "Tailoring requires a master resume or valid resume_id"],
                                        ["400", "NO_JOB_DESCRIPTION", "Regenerate requires a linked job description"],
                                        ["404", "NOT_FOUND", "Resource not found or belongs to another organization"],
                                        ["429", "RATE_LIMITED", "Request rate limit exceeded"],
                                        ["504", "TIMEOUT", "Tailoring exceeded the hard timeout"],
                                        ["503", "PDF_RENDER_FAILED", "PDF rendering failed"],
                                        ["500", "INTERNAL_ERROR", "Unexpected server error"],
                                    ].map(([code, literal, meaning]) => (
                                        <tr key={literal}>
                                            <td className="px-4 py-3 font-mono font-bold text-foreground">{code}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-violet-400">{literal}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{meaning}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── PLAYGROUND ── */}
                    <Playground />

                    {/* ── RESUME ENDPOINTS ── */}
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Resumes</h2>

                        <div id="resume-upload" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-upload-header" method="POST" path="/api/v1/resumes" description="Upload a PDF or DOCX resume (≤ 4 MB) via multipart/form-data. The file is parsed to structured JSON via LLM. Accepts an optional set_as_master boolean. If no master exists for the org, the uploaded resume is automatically designated master." />
                            <div className="space-y-3 px-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request — multipart/form-data</p>
                                <table className="w-full"><tbody>
                                    <ParamRow name="file" type="File" required desc="PDF or DOCX file. Max 4 MB." />
                                    <ParamRow name="set_as_master" type="boolean" desc="Promote this resume to master for the org. Auto-masters if no master exists." />
                                </tbody></table>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Response — 201</p>
                                <CodeBlock language="json" code={`{
  "data": {
    "resume_id": "res_01jwzxy8k3p5q",
    "is_master": true,
    "status": "READY",
    "filename": "resume.pdf"
  }
}`} />
                            </div>
                        </div>

                        <div id="resume-list" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-list-header" method="GET" path="/api/v1/resumes" description="List all resumes for your organization, sorted by updated_at desc. Supports filtering to include the master resume separately." />
                            <table className="w-full"><tbody>
                                <ParamRow name="include_master" type="boolean" desc="Include master resume in results. Default: false." />
                            </tbody></table>
                        </div>

                        <div id="resume-get" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-get-header" method="GET" path="/api/v1/resumes/{id}" description="Retrieve a single resume including its structured_data, job_description, job_keywords, strategy, and parent_id. Org-scoped — returns 404 for IDs belonging to other orgs." />
                        </div>

                        <div id="resume-patch" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-patch-header" method="PATCH" path="/api/v1/resumes/{id}" description="Manually update resume fields. All fields are optional. No LLM call is made." />
                            <div className="space-y-3 px-1">
                                <table className="w-full"><tbody>
                                    <ParamRow name="title" type="string" desc="Display title for the resume." />
                                    <ParamRow name="structuredData" type="object" desc="Partial or full ResumeData object to overwrite structured content." />
                                    <ParamRow name="status" type="string" desc="Resume status enum value." />
                                    <ParamRow name="filename" type="string" desc="Display filename." />
                                </tbody></table>
                            </div>
                        </div>

                        <div id="resume-delete" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-delete-header" method="DELETE" path="/api/v1/resumes/{id}" description="Delete a resume. Cascades to all linked CoverLetter and Outreach records." />
                        </div>

                        <div id="resume-tailor" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-tailor-header" method="POST" path="/api/v1/resumes/{id}/tailor" planGate="Starter+" description="Tailor the specified resume to a job description. Runs the full pipeline (keyword extraction → diff generation → safety nets → multi-pass refinement) and persists the tailored resume immediately. Hard timeout: 240 s." />
                            <div className="space-y-3 px-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request body (application/json)</p>
                                <table className="w-full"><tbody>
                                    <ParamRow name="jobDescription" type="string" required desc="Full text of the job description (min 50 chars). Used for keyword extraction and tailoring." />
                                    <ParamRow name="strategy" type='"nudge" | "keywords" | "full"' desc='nudge = minimal edits; keywords = reword bullets; full = comprehensive rewrite. Default: "nudge"' />
                                    <ParamRow name="generate_cover_letter" type="boolean" desc="Generate and persist a CoverLetter. Default: false." />
                                    <ParamRow name="generate_outreach" type="boolean" desc="Generate and persist an Outreach message. Default: false." />
                                    <ParamRow name="outputLanguage" type="string" desc='BCP-47 language tag for all LLM output. Default: "en".' />
                                </tbody></table>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Response — 201</p>
                                <CodeBlock language="json" code={`{
  "data": {
    "resume_id": "res_01jx2abc99def",
    "is_master": false,
    "status": "READY",
    "filename": "resume.pdf",
    "strategy": "keywords",
    "job_keywords": {
      "required_skills": ["TypeScript", "React"],
      "preferred_skills": ["GraphQL"],
      "keywords": ["API", "SaaS"],
      "key_responsibilities": ["Build APIs"],
      "experience_years": 3,
      "seniority_level": "Senior"
    },
    "parent_id": "res_01jwzxy8k3p5q",
    "cover_letter_id": "cl_01jx2cover",
    "outreach_id": null,
    "refinement_stats": {
      "passes_completed": 3,
      "keywords_injected": 5,
      "ai_phrases_removed": ["leveraged", "spearheaded"],
      "alignment_violations_fixed": 0,
      "initial_match_percentage": 54.2,
      "final_match_percentage": 81.7
    }
  }
}`} />
                                <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
                                    <p><strong className="text-foreground">201 is always returned</strong> when the pipeline completes. Hard timeout: <code className="font-mono">240 s</code> → <code className="font-mono">504 TIMEOUT</code>.</p>
                                </div>
                            </div>
                        </div>

                        <div id="resume-retry" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-retry-header" method="POST" path="/api/v1/resumes/{id}/retry" description="Re-run LLM parsing on the stored original_markdown. Only available when status is 'failed' or 'processing'. Returns 400 INVALID_STATUS otherwise." />
                        </div>

                        <div id="resume-pdf" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="resume-pdf-header" method="GET" path="/api/v1/resumes/{id}/pdf" description="Render and return the resume as a PDF (application/pdf). Uses headless Chromium." />
                            <table className="w-full"><tbody>
                                <ParamRow name="format" type='"A4" | "LETTER"' desc='Page size. Default: "A4".' />
                            </tbody></table>
                        </div>
                    </div>

                    {/* ── COVER LETTER ENDPOINTS ── */}
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Cover Letters</h2>

                        <div id="cl-list" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="cl-list-header" method="GET" path="/api/v1/resumes/{id}/cover-letters" description="List cover letters for a specific resume." />
                            <table className="w-full"><tbody>
                                <ParamRow name="id" type="string" required desc="Resume ID to list cover letters for." />
                                <ParamRow name="limit" type="number" desc="Page size. Default: 20." />
                                <ParamRow name="offset" type="number" desc="Pagination offset." />
                            </tbody></table>
                        </div>

                        <div id="cl-generate" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="cl-generate-header" method="POST" path="/api/v1/resumes/{id}/cover-letters" planGate="Starter+" description="Generate a new cover letter for the specified resume. Accepts an optional job_description override; falls back to the resume's stored job description." />
                            <table className="w-full"><tbody>
                                <ParamRow name="job_description" type="string" desc="Optional JD override. Falls back to the linked resume's stored JD if omitted." />
                            </tbody></table>
                        </div>

                        <div id="cl-get" className="scroll-mt-6">
                            <SectionHeader id="cl-get-header" method="GET" path="/api/v1/resumes/{id}/cover-letters/{clId}" description="Retrieve a single cover letter including its full content." />
                        </div>

                        <div id="cl-delete" className="scroll-mt-6">
                            <SectionHeader id="cl-delete-header" method="DELETE" path="/api/v1/resumes/{id}/cover-letters/{clId}" description="Delete a cover letter record." />
                        </div>

                        <div id="cl-regenerate" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="cl-regen-header" method="POST" path="/api/v1/resumes/{id}/cover-letters/{clId}/regenerate" planGate="Starter+" description="Regenerate the cover letter via AI. Optionally override the stored job description. Updates the record in place (same ID)." />
                            <table className="w-full"><tbody>
                                <ParamRow name="job_description" type="string" desc="Optional JD override. Falls back to the linked resume's stored JD if omitted." />
                            </tbody></table>
                        </div>

                    </div>

                    {/* ── OUTREACH ENDPOINTS ── */}
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Outreach Messages</h2>

                        <div id="out-list" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="out-list-header" method="GET" path="/api/v1/resumes/{id}/outreach" description="List outreach messages for a specific resume." />
                            <table className="w-full"><tbody>
                                <ParamRow name="id" type="string" required desc="Resume ID to list outreach messages for." />
                                <ParamRow name="limit" type="number" desc="Page size. Default: 20." />
                                <ParamRow name="offset" type="number" desc="Pagination offset." />
                            </tbody></table>
                        </div>

                        <div id="out-generate" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="out-generate-header" method="POST" path="/api/v1/resumes/{id}/outreach" planGate="Starter+" description="Generate a new outreach message for the specified resume. Accepts an optional job_description override; falls back to stored resume JD." />
                            <table className="w-full"><tbody>
                                <ParamRow name="job_description" type="string" desc="Optional JD override. Falls back to the linked resume's stored JD if omitted." />
                            </tbody></table>
                        </div>

                        <div id="out-get" className="scroll-mt-6">
                            <SectionHeader id="out-get-header" method="GET" path="/api/v1/resumes/{id}/outreach/{oId}" description="Retrieve a single outreach message." />
                        </div>

                        <div id="out-delete" className="scroll-mt-6">
                            <SectionHeader id="out-delete-header" method="DELETE" path="/api/v1/resumes/{id}/outreach/{oId}" description="Delete an outreach message." />
                        </div>

                        <div id="out-regenerate" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="out-regen-header" method="POST" path="/api/v1/resumes/{id}/outreach/{oId}/regenerate" planGate="Starter+" description="Regenerate the outreach message via AI. Optionally override the stored job description. Updates in place (same ID)." />
                            <table className="w-full"><tbody>
                                <ParamRow name="job_description" type="string" desc="Optional JD override. Falls back to the linked resume's stored JD if omitted." />
                            </tbody></table>
                        </div>
                    </div>

                    {/* ── SETTINGS & HEALTH ── */}
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Settings &amp; Health</h2>

                        <div id="settings-llm" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="settings-llm-header" method="GET" path="/api/v1/llm-config" description="Retrieve the organisation's LLM configuration. The stored API key is masked in the response." />
                            <SectionHeader id="settings-llm-put-header" method="PUT" path="/api/v1/llm-config" description="Update LLM provider, model, API key, and feature flags. All fields are optional — omit any field to leave it unchanged." />
                            <div className="space-y-3 px-1">
                                <table className="w-full"><tbody>
                                    <ParamRow name="provider" type="string" desc="LLM provider identifier (e.g. openai, anthropic)." />
                                    <ParamRow name="model" type="string" desc="Model name (e.g. gpt-4o, claude-3-5-sonnet)." />
                                    <ParamRow name="api_key" type="string" desc="Raw API key for the provider (stored encrypted)." />
                                    <ParamRow name="api_base" type="string | null" desc="Custom base URL for self-hosted or proxy endpoints." />
                                    <ParamRow name="reasoning_effort" type='"minimal"|"low"|"medium"|"high"' desc="Reasoning effort for supported models. Pass empty string to clear." />
                                    <ParamRow name="enable_cover_letter" type="boolean" desc="Enable automatic cover letter generation during tailoring." />
                                    <ParamRow name="enable_outreach_message" type="boolean" desc="Enable automatic outreach message generation during tailoring." />
                                    <ParamRow name="content_language" type="string" desc="Default output language (BCP-47 tag, e.g. en, es, zh)." />
                                    <ParamRow name="default_prompt_id" type="string" desc="Default tailoring strategy (nudge | keywords | full)." />
                                </tbody></table>
                            </div>
                        </div>

                        <div id="health" className="scroll-mt-6 space-y-4">
                            <SectionHeader id="health-header" method="GET" path="/api/v1/health" description="Public endpoint — no authentication required. Returns database liveness status. Useful for uptime monitors and deployment smoke tests." />
                            <CodeBlock language="json" code={`// 200 OK
{ "data": { "status": "ok", "db": "ok" } }

// 503 — DB unreachable
{ "error": "INTERNAL_ERROR", "detail": "Database unreachable" }`} />
                        </div>
                    </div>

                    {/* ── DATA MODELS ── */}
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Data Models</h2>

                        <div id="model-resume" className="scroll-mt-6 space-y-4">
                            <h3 className="text-base font-semibold text-foreground">ResumeData</h3>
                            <p className="text-sm text-muted-foreground">The structured representation of a parsed resume. Returned in <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">structured_data</code> on resume GET and in <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">resume_data</code> on tailor responses.</p>
                            <CodeBlock language="typescript" code={`type ResumeData = {
  personalInfo: {
    name: string; title: string; email: string; phone: string;
    location: string; website?: string; linkedin?: string; github?: string;
  }
  summary: string
  workExperience: Array<{
    id: number; title: string; company: string;
    location?: string; years: string; description: string[];
  }>
  education: Array<{
    id: number; institution: string; degree: string;
    years: string; description?: string;
  }>
  personalProjects: Array<{
    id: number; name: string; role: string; years: string;
    github?: string; website?: string; description: string[];
  }>
  additional: {
    technicalSkills: string[]; languages: string[];
    certificationsTraining: string[]; awards: string[];
  }
  customSections: Record<string, CustomSection>
}`} />
                        </div>

                        <div id="model-keywords" className="scroll-mt-6 space-y-4">
                            <h3 className="text-base font-semibold text-foreground">JobKeywords</h3>
                            <p className="text-sm text-muted-foreground">Extracted from the job description during the tailoring pipeline. Returned in <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">job_keywords</code> on tailored resume records.</p>
                            <CodeBlock language="typescript" code={`type JobKeywords = {
  required_skills: string[]
  preferred_skills: string[]
  keywords: string[]
  key_responsibilities: string[]
  experience_years: number | null
  seniority_level: string | null
}`} />
                        </div>

                        <div id="model-refinement" className="scroll-mt-6 space-y-4">
                            <h3 className="text-base font-semibold text-foreground">RefinementStats</h3>
                            <p className="text-sm text-muted-foreground">Included in every tailor response. Summarises the outcome of the 3-pass refinement step.</p>
                            <CodeBlock language="typescript" code={`type RefinementStats = {
  passes_completed: number          // 0–3
  keywords_injected: number         // keywords added in Pass 1
  ai_phrases_removed: string[]      // phrases removed in Pass 2
  alignment_violations_fixed: number // fabrications removed in Pass 3
  initial_match_percentage: number  // % before refinement
  final_match_percentage: number    // % after refinement
}`} />
                            <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
                                <p><strong className="text-foreground">Pass 1 — Keyword Injection:</strong> Only injects keywords that already exist in the master resume (whole-word boundary matching). Non-injectable keywords are never added.</p>
                                <p><strong className="text-foreground">Pass 2 — AI Phrase Removal:</strong> Regex pass removing blacklisted phrases (leveraged, spearheaded, orchestrated, etc.). Phrases appearing in the JD are protected.</p>
                                <p><strong className="text-foreground">Pass 3 — Alignment Validation:</strong> Compares tailored resume against master. Fabricated skills, certifications, and employers are automatically removed.</p>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
