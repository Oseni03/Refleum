import { Method } from '@/types';
import React from 'react'

// ─── Method badge styles ──────────────────────────────────────────────────────

const METHOD_STYLES: Record<Method, { pill: string; border: string }> = {
    GET: { pill: "bg-blue-500/10 text-blue-500 border-blue-500/20", border: "border-blue-500/30" },
    POST: { pill: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", border: "border-emerald-500/30" },
    PATCH: { pill: "bg-amber-500/10 text-amber-500 border-amber-500/20", border: "border-amber-500/30" },
    PUT: { pill: "bg-violet-500/10 text-violet-500 border-violet-500/20", border: "border-violet-500/30" },
    DELETE: { pill: "bg-red-500/10 text-red-500 border-red-500/20", border: "border-red-500/30" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

export function MethodBadge({ method }: { method: Method }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-widest border ${METHOD_STYLES[method].pill}`}>
            {method}
        </span>
    );
}

function SectionHeader({ id, method, path, description, planGate }: {
    id: string; method: Method; path: string; description: string; planGate?: string;
}) {
    return (
        <div id={id} className={`scroll-mt-6 rounded-xl border ${METHOD_STYLES[method].border} bg-card overflow-hidden`}>
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
                <MethodBadge method={method} />
                <code className="text-sm font-mono text-foreground font-medium">{path}</code>
                {planGate && (
                    <span className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {planGate}
                    </span>
                )}
            </div>
            <p className="px-5 py-3 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

export default SectionHeader