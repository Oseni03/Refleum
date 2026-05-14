'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Method } from '@/types';
import { MethodBadge } from './section-header';

// ─── Field types ──────────────────────────────────────────────────────────────

type FieldType = 'text' | 'textarea' | 'select' | 'boolean' | 'file' | 'number';

interface BaseField {
    key: string;
    label: string;
    type: FieldType;
    options?: string[];
    placeholder?: string;
    required?: boolean;
    defaultValue?: string | boolean | number;
}

type PlaygroundEndpoint = {
    id: string;
    method: Method;
    path: string;
    label: string;
    hasFileUpload?: boolean;
    /** Fields sent in the request body (POST / PUT / PATCH). */
    bodyFields?: BaseField[];
    /** Fields sent as URL query parameters (GET / DELETE). */
    queryFields?: BaseField[];
    /** Path parameter names (e.g. ["id"]). */
    pathParams?: string[];
};

// ─── Endpoint definitions ─────────────────────────────────────────────────────

const PLAYGROUND_ENDPOINTS: PlaygroundEndpoint[] = [
    {
        id: 'upload',
        method: 'POST',
        path: '/api/v1/resumes',
        label: 'Upload Resume',
        hasFileUpload: true,
        bodyFields: [
            { key: 'set_as_master', label: 'Set as master', type: 'boolean', defaultValue: false },
        ],
    },
    {
        id: 'list-resumes',
        method: 'GET',
        path: '/api/v1/resumes',
        label: 'List Resumes',
        queryFields: [
            { key: 'include_master', label: 'include_master', type: 'boolean', defaultValue: true },
            { key: 'limit', label: 'limit', type: 'number', defaultValue: 10 },
            { key: 'offset', label: 'offset', type: 'number', defaultValue: 0 },
        ],
    },
    {
        id: 'get-resume',
        method: 'GET',
        path: '/api/v1/resumes/{id}',
        label: 'Get Resume',
        pathParams: ['id'],
    },
    {
        id: 'delete-resume',
        method: 'DELETE',
        path: '/api/v1/resumes/{id}',
        label: 'Delete Resume',
        pathParams: ['id'],
    },
    {
        id: 'tailor',
        method: 'POST',
        path: '/api/v1/resumes/{id}/tailor',
        label: 'Tailor Resume',
        pathParams: ['id'],
        bodyFields: [
            { key: 'job_description', label: 'Job Description', type: 'textarea', required: true, placeholder: 'Paste the full job description here…' },
            { key: 'strategy', label: 'Strategy', type: 'select', options: ['NUDGE', 'KEYWORDS', 'FULL'], defaultValue: 'NUDGE' },
            { key: 'generate_cover_letter', label: 'Generate cover letter', type: 'boolean', defaultValue: false },
            { key: 'generate_outreach', label: 'Generate outreach', type: 'boolean', defaultValue: false },
            { key: 'output_language', label: 'Output language', type: 'select', options: ['en', 'es', 'zh', 'ja', 'pt'], defaultValue: 'en' },
        ],
    },
    {
        id: 'retry-resume',
        method: 'POST',
        path: '/api/v1/resumes/{id}/retry',
        label: 'Retry Parsing',
        pathParams: ['id'],
    },
    {
        id: 'get-resume-pdf',
        method: 'GET',
        path: '/api/v1/resumes/{id}/pdf',
        label: 'Get Resume PDF',
        pathParams: ['id'],
        queryFields: [
            { key: 'format', label: 'format', type: 'text', placeholder: 'Optional' },
        ],
    },
    {
        id: 'list-cl',
        method: 'GET',
        path: '/api/v1/cover-letters',
        label: 'List Cover Letters',
        queryFields: [
            { key: 'resume_id', label: 'resume_id', type: 'text', placeholder: 'Optional' },
            { key: 'limit', label: 'limit', type: 'number', defaultValue: 10 },
            { key: 'offset', label: 'offset', type: 'number', defaultValue: 0 },
        ],
    },
    {
        id: 'get-cl',
        method: 'GET',
        path: '/api/v1/cover-letters/{id}',
        label: 'Get Cover Letter',
        pathParams: ['id'],
    },
    {
        id: 'update-cl',
        method: 'PATCH',
        path: '/api/v1/cover-letters/{id}',
        label: 'Update Cover Letter',
        pathParams: ['id'],
        bodyFields: [
            { key: 'content', label: 'Content', type: 'text', required: true },
        ],
    },
    {
        id: 'delete-cl',
        method: 'DELETE',
        path: '/api/v1/cover-letters/{id}',
        label: 'Delete Cover Letter',
        pathParams: ['id'],
    },
    {
        id: 'regen-cl',
        method: 'POST',
        path: '/api/v1/cover-letters/{id}/regenerate',
        label: 'Regenerate Cover Letter',
        pathParams: ['id'],
        bodyFields: [
            { key: 'job_description', label: 'Job Description (optional override)', type: 'textarea', placeholder: 'Falls back to stored JD' },
        ],
    },
    {
        id: 'get-cl-pdf',
        method: 'GET',
        path: '/api/v1/cover-letters/{id}/pdf',
        label: 'Get Cover Letter PDF',
        pathParams: ['id'],
        queryFields: [
            { key: 'format', label: 'Format', type: 'select', options: ['A4', 'Letter'], defaultValue: 'A4' },
        ],
    },
    {
        id: 'list-outreach',
        method: 'GET',
        path: '/api/v1/outreach',
        label: 'List Outreach',
        queryFields: [
            { key: 'resume_id', label: 'resume_id', type: 'text', placeholder: 'Optional' },
            { key: 'limit', label: 'limit', type: 'number', defaultValue: 10 },
            { key: 'offset', label: 'offset', type: 'number', defaultValue: 0 },
        ],
    },
    {
        id: 'get-outreach',
        method: 'GET',
        path: '/api/v1/outreach/{id}',
        label: 'Get Outreach',
        pathParams: ['id'],
    },
    {
        id: 'update-outreach',
        method: 'PATCH',
        path: '/api/v1/outreach/{id}',
        label: 'Update Outreach',
        pathParams: ['id'],
        bodyFields: [
            { key: 'content', label: 'Content', type: 'text', required: true },
        ],
    },
    {
        id: 'delete-outreach',
        method: 'DELETE',
        path: '/api/v1/outreach/{id}',
        label: 'Delete Outreach',
        pathParams: ['id'],
    },
    {
        id: 'regen-outreach',
        method: 'POST',
        path: '/api/v1/outreach/{id}/regenerate',
        label: 'Regenerate Outreach',
        pathParams: ['id'],
        bodyFields: [
            { key: 'job_description', label: 'Job Description (optional override)', type: 'textarea', placeholder: 'Falls back to stored JD' },
        ],
    },
    {
        id: 'get-llm-config',
        method: 'GET',
        path: '/api/v1/llm-config',
        label: 'Get LLM Config',
    },
    {
        id: 'update-llm-config',
        method: 'PUT',
        path: '/api/v1/llm-config',
        label: 'Update LLM Config',
        bodyFields: [
            { key: 'provider', label: 'Provider', type: 'select', options: ['openai', 'anthropic', 'openai_compatible', 'deepseek', 'openrouter', 'ollama', 'gemini'], required: true, defaultValue: 'openai' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g. gpt-4o, deepseek-chat', required: true, defaultValue: 'gpt-4o' },
            { key: 'api_key', label: 'API Key', type: 'text', required: true },
            { key: 'api_base', label: 'API base URL', type: 'text' },
            { key: 'reasoning_effort', label: 'Reasoning effort', type: 'select', options: ['high', 'medium', 'low', 'minimal'] },
            { key: 'enable_cover_letter', label: 'Enable cover letter', type: 'boolean', defaultValue: false },
            { key: 'enable_outreach', label: 'Enable outreach', type: 'boolean', defaultValue: false },
            { key: 'content_language', label: 'Content language', type: 'select', options: ['en', 'es', 'zh', 'ja', 'pt'], defaultValue: 'en' },
            { key: 'default_prompt_id', label: 'Default prompt ID', type: 'select', options: ["NUDGE", "KEYWORDS", "FULL"], defaultValue: "KEYWORDS" },
        ],
    },
];

// ─── Field value types ────────────────────────────────────────────────────────

type FieldValue = string | boolean | number;

function defaultsFor(endpoint: PlaygroundEndpoint): Record<string, FieldValue> {
    const out: Record<string, FieldValue> = {};
    const allFields = [...(endpoint.queryFields ?? []), ...(endpoint.bodyFields ?? [])];
    for (const f of allFields) {
        if (f.defaultValue !== undefined) out[f.key] = f.defaultValue;
    }
    return out;
}

// ─── Response type ────────────────────────────────────────────────────────────

interface ApiResponse {
    status: number;
    body: string;
    isPdf?: boolean;
    pdfUrl?: string;
}

// ─── Playground component ─────────────────────────────────────────────────────

function Playground({ apiKeyFromParent }: { apiKeyFromParent?: string }) {
    const [selectedId, setSelectedId] = useState('upload');
    const [apiKey, setApiKey] = useState(apiKeyFromParent ?? '');
    const [pathValues, setPathValues] = useState<Record<string, string>>({});
    const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const endpoint = PLAYGROUND_ENDPOINTS.find((e) => e.id === selectedId)!;

    // Reset state and apply default values when endpoint changes
    useEffect(() => {
        setPathValues({});
        setFieldValues(defaultsFor(endpoint));
        setFile(null);
        setResponse(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    /** Path with {param} tokens replaced by user-entered values */
    const resolvedPath = (endpoint.pathParams ?? []).reduce(
        (p, param) => p.replace(`{${param}}`, pathValues[param] ?? `{${param}}`),
        endpoint.path
    );

    // ── Determine which field set is "active" for this endpoint ──────────────
    const isReadOrDelete = endpoint.method === 'GET' || endpoint.method === 'DELETE';
    /** Fields that contribute to the query string (GET / DELETE) */
    const activeQueryFields = isReadOrDelete ? (endpoint.queryFields ?? []) : [];
    /** Fields that contribute to the request body (POST / PUT / PATCH) */
    const activeBodyFields = !isReadOrDelete ? (endpoint.bodyFields ?? []).filter((f) => f.type !== 'file') : [];

    // ── Build & send the real request ─────────────────────────────────────────
    const handleSend = async () => {
        if (!apiKey) {
            alert('Enter your API key first.');
            return;
        }

        setLoading(true);
        setResponse(null);

        // Clean up any previous blob URL
        if (response?.pdfUrl) {
            URL.revokeObjectURL(response.pdfUrl);
        }

        try {
            const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
            let url = `${BASE}${resolvedPath}`;

            const headers: Record<string, string> = {
                Authorization: `Bearer ${apiKey}`,
            };
            let body: BodyInit | undefined;

            if (isReadOrDelete) {
                // Append query parameters
                const qs = new URLSearchParams();
                for (const f of activeQueryFields) {
                    const val = fieldValues[f.key];
                    // Only append if a meaningful value is present
                    if (val !== undefined && val !== '' && val !== false) {
                        qs.set(f.key, String(val));
                    }
                }
                if (qs.toString()) url += `?${qs.toString()}`;
            } else if (endpoint.hasFileUpload) {
                // Multipart form data — do NOT set Content-Type; browser sets boundary
                const fd = new FormData();
                if (file) fd.append('file', file);
                for (const f of endpoint.bodyFields ?? []) {
                    const val = fieldValues[f.key];
                    if (val !== undefined && val !== '' && val !== false) {
                        fd.append(f.key, String(val));
                    }
                }
                body = fd;
            } else {
                // JSON body
                const json: Record<string, unknown> = {};
                for (const f of activeBodyFields) {
                    const val = fieldValues[f.key];
                    // Include the field if it has any value (including false for booleans)
                    if (val !== undefined && val !== '') {
                        json[f.key] = val;
                    }
                }
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(json);
            }

            const res = await fetch(url, { method: endpoint.method, headers, body });

            const contentType = res.headers.get('content-type') ?? '';

            // ── PDF response ───────────────────────────────────────────────────────
            if (contentType.includes('application/pdf')) {
                const blob = await res.blob();
                const pdfUrl = URL.createObjectURL(blob);
                const size = blob.size;
                setResponse({
                    status: res.status,
                    body: `[PDF — ${(size / 1024).toFixed(1)} KB]  Click "Open PDF" to view.`,
                    isPdf: true,
                    pdfUrl,
                });
                return;
            }

            // ── JSON / text response ───────────────────────────────────────────────
            let responseBody: string;
            try {
                const data = await res.json();
                responseBody = JSON.stringify(data, null, 2);
            } catch {
                responseBody = await res.text();
            }

            setResponse({ status: res.status, body: responseBody });
        } catch (err) {
            setResponse({ status: 0, body: err instanceof Error ? err.message : String(err) });
        } finally {
            setLoading(false);
        }
    };

    // ── Field renderer ─────────────────────────────────────────────────────────
    const renderField = (field: BaseField) => {
        const val = fieldValues[field.key];

        if (field.type === 'textarea') {
            return (
                <textarea
                    rows={4}
                    value={String(val ?? '')}
                    onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
            );
        }

        if (field.type === 'select') {
            return (
                <select
                    value={String(val ?? field.options![0])}
                    onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                    {field.options!.map((o) => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
            );
        }

        if (field.type === 'boolean') {
            const checked = Boolean(val);
            return (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFieldValues((p) => ({ ...p, [field.key]: !p[field.key] }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
                        aria-pressed={checked}
                    >
                        <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`}
                        />
                    </button>
                    <span className="text-xs text-muted-foreground">{checked ? 'true' : 'false'}</span>
                </div>
            );
        }

        if (field.type === 'number') {
            return (
                <input
                    type="number"
                    value={val !== undefined ? String(val) : ''}
                    onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.valueAsNumber }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
            );
        }

        // text (default)
        return (
            <input
                type="text"
                value={String(val ?? '')}
                onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
        );
    };

    // ── Status badge helpers ───────────────────────────────────────────────────
    const isSuccess = response && response.status >= 200 && response.status < 300;

    return (
        <div id="playground" className="scroll-mt-6 rounded-2xl border border-border overflow-hidden bg-card">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-foreground tracking-wide">API Playground</h2>
                <span className="text-xs text-muted-foreground">Try requests live</span>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] divide-x divide-border">
                {/* ── Sidebar: endpoint selector ──────────────────────────────────── */}
                <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[600px]">
                    {PLAYGROUND_ENDPOINTS.map((ep) => (
                        <button
                            key={ep.id}
                            type="button"
                            onClick={() => setSelectedId(ep.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors text-sm ${selectedId === ep.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <span
                                className={`text-[10px] font-bold w-12 shrink-0 ${ep.method === 'GET'
                                    ? 'text-blue-500'
                                    : ep.method === 'POST'
                                        ? 'text-emerald-500'
                                        : ep.method === 'DELETE'
                                            ? 'text-red-500'
                                            : 'text-amber-500'
                                    }`}
                            >
                                {ep.method}
                            </span>
                            <span className="truncate">{ep.label}</span>
                        </button>
                    ))}
                </nav>

                {/* ── Main: request builder ────────────────────────────────────────── */}
                <div className="p-5 space-y-5 overflow-y-auto max-h-[600px]">
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border overflow-hidden">
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
                                        value={pathValues[param] ?? ''}
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
                                role="button"
                                tabIndex={0}
                                onClick={() => fileRef.current?.click()}
                                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                                className={`relative cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors ${file
                                    ? 'border-emerald-500/40 bg-emerald-500/5'
                                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                                    }`}
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
                                        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm text-muted-foreground">
                                            Drop PDF or DOCX here, or <span className="text-primary">browse</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">Max 4 MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Query fields (GET / DELETE) */}
                    {activeQueryFields.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query Parameters</p>
                            {activeQueryFields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {field.label}
                                        {field.required && <span className="ml-1 text-red-400">*</span>}
                                    </label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Body fields (POST / PUT / PATCH) */}
                    {activeBodyFields.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Body</p>
                            {activeBodyFields.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {field.label}
                                        {field.required && <span className="ml-1 text-red-400">*</span>}
                                    </label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Send button */}
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending…
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Request
                            </>
                        )}
                    </button>

                    {/* Response panel */}
                    {response && (
                        <div className="rounded-xl border border-border overflow-hidden">
                            {/* Status bar */}
                            <div
                                className={`flex items-center gap-2 px-4 py-2.5 border-b border-border text-xs font-medium ${response.status === 0
                                    ? 'bg-yellow-500/10 text-yellow-400'
                                    : isSuccess
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-red-500/10 text-red-400'
                                    }`}
                            >
                                <span className="font-bold">
                                    {response.status === 0 ? 'ERR' : response.status}
                                </span>
                                <span>
                                    {response.status === 0
                                        ? 'Network error'
                                        : isSuccess
                                            ? 'Success'
                                            : 'Error'}
                                </span>

                                {/* PDF open link */}
                                {response.isPdf && response.pdfUrl && (
                                    <a
                                        href={response.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto text-primary underline underline-offset-2 font-normal"
                                    >
                                        Open PDF ↗
                                    </a>
                                )}

                                {!response.isPdf && (
                                    <span className="ml-auto text-muted-foreground font-normal">Response</span>
                                )}
                            </div>

                            {/* Response body */}
                            <pre className="p-4 text-xs text-zinc-300 overflow-x-auto bg-[#0d0d0d] leading-relaxed max-h-72 whitespace-pre-wrap break-words">
                                {response.body}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Playground;