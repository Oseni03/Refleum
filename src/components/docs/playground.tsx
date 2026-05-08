import React, { useEffect, useRef, useState } from 'react'
import { Method } from '@/types';
import { MethodBadge } from './section-header';

type PlaygroundEndpoint = {
    id: string;
    method: Method;
    path: string;
    label: string;
    hasFileUpload?: boolean;
    bodyFields?: Array<{
        key: string; label: string; type: "text" | "textarea" | "select" | "boolean" | "file";
        options?: string[]; placeholder?: string; required?: boolean;
    }>;
    pathParams?: string[];
};

const PLAYGROUND_ENDPOINTS: PlaygroundEndpoint[] = [
    {
        id: "upload",
        method: "POST",
        path: "/api/v1/resumes/upload",
        label: "Upload Resume",
        hasFileUpload: true,
        bodyFields: [
            { key: "set_as_master", label: "Set as master", type: "boolean" },
        ],
    },
    {
        id: "tailor",
        method: "POST",
        path: "/api/v1/resumes/tailor",
        label: "Tailor Resume",
        bodyFields: [
            { key: "job_description", label: "Job Description", type: "textarea", required: true, placeholder: "Paste the full job description here..." },
            { key: "resume_id", label: "Resume ID (optional)", type: "text", placeholder: "Defaults to master resume" },
            { key: "strategy", label: "Strategy", type: "select", options: ["nudge", "keywords", "full"] },
            { key: "generate_cover_letter", label: "Generate cover letter", type: "boolean" },
            { key: "generate_outreach", label: "Generate outreach", type: "boolean" },
            { key: "output_language", label: "Output language", type: "select", options: ["en", "es", "zh", "ja", "pt"] },
        ],
    },
    {
        id: "list-resumes",
        method: "GET",
        path: "/api/v1/resumes",
        label: "List Resumes",
        bodyFields: [
            { key: "include_master", label: "include_master (query)", type: "boolean" },
        ],
    },
    {
        id: "get-resume",
        method: "GET",
        path: "/api/v1/resumes/{id}",
        label: "Get Resume",
        pathParams: ["id"],
    },
    {
        id: "delete-resume",
        method: "DELETE",
        path: "/api/v1/resumes/{id}",
        label: "Delete Resume",
        pathParams: ["id"],
    },
    {
        id: "retry-resume",
        method: "POST",
        path: "/api/v1/resumes/{id}/retry",
        label: "Retry Parsing",
        pathParams: ["id"],
    },
    {
        id: "list-cl",
        method: "GET",
        path: "/api/v1/cover-letters",
        label: "List Cover Letters",
        bodyFields: [
            { key: "resume_id", label: "resume_id (query filter)", type: "text", placeholder: "Optional" },
        ],
    },
    {
        id: "regen-cl",
        method: "POST",
        path: "/api/v1/cover-letters/{id}/regenerate",
        label: "Regenerate Cover Letter",
        pathParams: ["id"],
        bodyFields: [
            { key: "job_description", label: "Job Description (optional override)", type: "textarea", placeholder: "Falls back to stored JD" },
        ],
    },
    {
        id: "list-out",
        method: "GET",
        path: "/api/v1/outreach",
        label: "List Outreach",
    },
    {
        id: "regen-out",
        method: "POST",
        path: "/api/v1/outreach/{id}/regenerate",
        label: "Regenerate Outreach",
        pathParams: ["id"],
        bodyFields: [
            { key: "job_description", label: "Job Description (optional override)", type: "textarea", placeholder: "Falls back to stored JD" },
        ],
    },
];

function Playground({ apiKeyFromParent }: { apiKeyFromParent?: string }) {
    const [selectedId, setSelectedId] = useState("upload");
    const [apiKey, setApiKey] = useState(apiKeyFromParent ?? "");
    const [pathValues, setPathValues] = useState<Record<string, string>>({});
    const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const endpoint = PLAYGROUND_ENDPOINTS.find((e) => e.id === selectedId)!;

    // Reset fields on endpoint change
    useEffect(() => {
        setPathValues({});
        setFieldValues({});
        setFile(null);
        setResponse(null);
    }, [selectedId]);

    const resolvedPath = (endpoint.pathParams ?? []).reduce(
        (p, param) => p.replace(`{${param}}`, pathValues[param] ?? `{${param}}`),
        endpoint.path
    );

    const handleSend = async () => {
        if (!apiKey) { alert("Enter your API key first."); return; }
        setLoading(true);
        setResponse(null);

        try {
            const BASE = process.env.NEXT_PUBLIC_API_URL;
            let url = `${BASE}${resolvedPath}`;

            const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
            let body: BodyInit | undefined;

            if (endpoint.method === "GET" || endpoint.method === "DELETE") {
                // query params
                const qs = new URLSearchParams();
                (endpoint.bodyFields ?? []).forEach((f) => {
                    const val = fieldValues[f.key];
                    if (val !== undefined && val !== "" && val !== false) qs.set(f.key, String(val));
                });
                if (qs.toString()) url += `?${qs.toString()}`;
            } else if (endpoint.hasFileUpload) {
                const fd = new FormData();
                if (file) fd.append("file", file);
                (endpoint.bodyFields ?? []).forEach((f) => {
                    const val = fieldValues[f.key];
                    if (val !== undefined && val !== "") fd.append(f.key, String(val));
                });
                body = fd;
            } else {
                const json: Record<string, unknown> = {};
                (endpoint.bodyFields ?? []).forEach((f) => {
                    const val = fieldValues[f.key];
                    if (val !== undefined && val !== "") {
                        json[f.key] = f.type === "boolean" ? val : val;
                    }
                });
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(json);
            }

            // Simulate response for demo (real implementation would fetch)
            await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
            const mockStatuses: Record<Method, number> = { POST: 201, GET: 200, PATCH: 200, DELETE: 200 };
            const mockBodies: Record<string, object> = {
                upload: { resume_id: "res_01jwzxy8k3p5q", is_master: true, status: "PROCESSING", filename: file?.name ?? "resume.pdf" },
                tailor: { resume_id: "res_01jx2abc99def", title: "Senior Engineer @ Acme Corp", strategy: fieldValues["strategy"] ?? "nudge", refinement_stats: { passes_completed: 3, keywords_injected: 5, ai_phrases_removed: ["leveraged", "spearheaded"], alignment_violations_fixed: 0, initial_match_percentage: 54.2, final_match_percentage: 81.7 }, rejected_changes: 1, cover_letter_id: fieldValues["generate_cover_letter"] ? "cl_01jx2cover" : null, outreach_id: fieldValues["generate_outreach"] ? "out_01jx2reach" : null, warnings: [] },
                "list-resumes": { data: [{ resume_id: "res_01jwzxy8k3p5q", is_master: true, filename: "resume.pdf", status: "READY", updated_at: new Date().toISOString() }], total: 1 },
                "get-resume": { resume_id: pathValues["id"] ?? "res_xxx", is_master: false, status: "READY", structured_data: { personalInfo: { name: "Jane Smith" } } },
                "delete-resume": { deleted: true },
                "retry-resume": { resume_id: pathValues["id"] ?? "res_xxx", status: "PROCESSING" },
                "list-cl": { data: [], total: 0 },
                "regen-cl": { cover_letter_id: pathValues["id"] ?? "cl_xxx", content: "Dear Hiring Manager, ...", updated_at: new Date().toISOString() },
                "list-out": { data: [], total: 0 },
                "regen-out": { outreach_id: pathValues["id"] ?? "out_xxx", content: "Hi [Name], I came across your posting for...", updated_at: new Date().toISOString() },
            };

            setResponse({
                status: mockStatuses[endpoint.method],
                body: JSON.stringify(mockBodies[selectedId] ?? { ok: true }, null, 2),
            });
        } catch (err) {
            setResponse({ status: 0, body: String(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="playground" className="scroll-mt-6 rounded-2xl border border-border overflow-hidden bg-card">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-foreground tracking-wide">API Playground</h2>
                <span className="text-xs text-muted-foreground">Try requests live</span>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] divide-x divide-border">
                {/* Endpoint selector */}
                <div className="p-3 space-y-0.5 overflow-y-auto max-h-[600px]">
                    {PLAYGROUND_ENDPOINTS.map((ep) => (
                        <button
                            key={ep.id}
                            onClick={() => setSelectedId(ep.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors text-sm ${selectedId === ep.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                            <span className={`text-[10px] font-bold w-12 shrink-0 ${ep.method === "GET" ? "text-blue-500" : ep.method === "POST" ? "text-emerald-500" : ep.method === "DELETE" ? "text-red-500" : "text-amber-500"}`}>
                                {ep.method}
                            </span>
                            <span className="truncate">{ep.label}</span>
                        </button>
                    ))}
                </div>

                {/* Request builder */}
                <div className="p-5 space-y-5">
                    {/* API Key */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk_live_••••••••••••••••"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                    </div>

                    {/* Resolved URL */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
                        <MethodBadge method={endpoint.method} />
                        <code className="text-xs font-mono text-muted-foreground truncate">{resolvedPath}</code>
                    </div>

                    {/* Path params */}
                    {(endpoint.pathParams ?? []).length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path Parameters</p>
                            {endpoint.pathParams!.map((param) => (
                                <div key={param}>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">{param}</label>
                                    <input
                                        type="text"
                                        value={pathValues[param] ?? ""}
                                        onChange={(e) => setPathValues((p) => ({ ...p, [param]: e.target.value }))}
                                        placeholder={`Enter ${param}`}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* File upload */}
                    {endpoint.hasFileUpload && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">File Upload</p>
                            <div
                                onClick={() => fileRef.current?.click()}
                                className={`relative cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors ${file ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                />
                                {file ? (
                                    <>
                                        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <p className="text-sm text-muted-foreground">Drop PDF or DOCX here, or <span className="text-primary">browse</span></p>
                                        <p className="text-xs text-muted-foreground/60">Max 4 MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Body fields */}
                    {(endpoint.bodyFields ?? []).filter((f) => f.type !== "file").length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {endpoint.method === "GET" ? "Query Parameters" : "Request Body"}
                            </p>
                            {endpoint.bodyFields!.filter((f) => f.type !== "file").map((field) => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {field.label}
                                        {field.required && <span className="ml-1 text-red-400">*</span>}
                                    </label>
                                    {field.type === "textarea" ? (
                                        <textarea
                                            rows={4}
                                            value={String(fieldValues[field.key] ?? "")}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    ) : field.type === "select" ? (
                                        <select
                                            value={String(fieldValues[field.key] ?? field.options![0])}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        >
                                            {field.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : field.type === "boolean" ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setFieldValues((p) => ({ ...p, [field.key]: !p[field.key] }))}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${fieldValues[field.key] ? "bg-primary" : "bg-muted"}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${fieldValues[field.key] ? "translate-x-4" : "translate-x-1"}`} />
                                            </button>
                                            <span className="text-xs text-muted-foreground">{fieldValues[field.key] ? "true" : "false"}</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={String(fieldValues[field.key] ?? "")}
                                            onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Send */}
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Sending…
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                Send Request
                            </>
                        )}
                    </button>

                    {/* Response */}
                    {response && (
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-border text-xs font-medium ${response.status >= 200 && response.status < 300 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"}`}>
                                <span className="font-bold">{response.status}</span>
                                <span>{response.status >= 200 && response.status < 300 ? "Success" : "Error"}</span>
                                <span className="ml-auto text-muted-foreground font-normal">Response</span>
                            </div>
                            <pre className="p-4 text-xs text-zinc-300 overflow-x-auto bg-[#0d0d0d] leading-relaxed max-h-72">
                                {response.body}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Playground