import { Metadata } from "next";

export const metadata: Metadata = {
    title: "API Documentation | AI Resume Builder",
    description: "API documentation for the AI Resume Builder platform.",
};

export default function ApiDocsPage() {
    return (
        <div className="container mx-auto py-12 max-w-4xl space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">API Documentation</h1>
                <p className="text-lg text-muted-foreground">
                    Welcome to the AI Resume Builder API. You can use these endpoints to programmatically manage resumes, job descriptions, and AI-powered improvements.
                </p>
            </div>

            <div className="space-y-4 border-b pb-8">
                <h2 className="text-2xl font-semibold">Authentication</h2>
                <p className="text-muted-foreground">
                    All API requests must include your API key in the <code>Authorization</code> header:
                </p>
                <pre className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <code>Authorization: Bearer YOUR_API_KEY</code>
                </pre>
            </div>

            <div className="space-y-8 border-b pb-8">
                <h2 className="text-2xl font-semibold">Resumes</h2>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm uppercase">POST</span>
                        /api/v1/resumes/upload
                    </h3>
                    <p className="text-muted-foreground">Upload a new resume. Accepts <code>multipart/form-data</code> with a <code>file</code> field.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-sm uppercase">GET</span>
                        /api/v1/resumes/list
                    </h3>
                    <p className="text-muted-foreground">Get a paginated list of your resumes.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-sm uppercase">GET</span>
                        /api/v1/resumes/[id]
                    </h3>
                    <p className="text-muted-foreground">Retrieve a specific resume.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-sm uppercase">PATCH</span>
                        /api/v1/resumes/[id]
                    </h3>
                    <p className="text-muted-foreground">Update specific fields of a resume.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-sm uppercase">DELETE</span>
                        /api/v1/resumes/[id]
                    </h3>
                    <p className="text-muted-foreground">Delete a resume.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-sm uppercase">GET</span>
                        /api/v1/resumes/[id]/pdf
                    </h3>
                    <p className="text-muted-foreground">Generates and returns the resume as a PDF file.</p>
                </div>
            </div>

            <div className="space-y-8 border-b pb-8">
                <h2 className="text-2xl font-semibold">Jobs</h2>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm uppercase">POST</span>
                        /api/v1/jobs
                    </h3>
                    <p className="text-muted-foreground">Upload one or more job descriptions.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-sm uppercase">GET</span>
                        /api/v1/jobs/[id]
                    </h3>
                    <p className="text-muted-foreground">Retrieve a specific job description and its analysis.</p>
                </div>
            </div>

            <div className="space-y-8 pb-8">
                <h2 className="text-2xl font-semibold">AI Improvements</h2>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm uppercase">POST</span>
                        /api/v1/resumes/improve/preview
                    </h3>
                    <p className="text-muted-foreground">Generate a preview of AI improvements for a resume against a job description.</p>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-medium flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm uppercase">POST</span>
                        /api/v1/resumes/improve/confirm
                    </h3>
                    <p className="text-muted-foreground">Confirm and apply the previewed improvements.</p>
                </div>
            </div>
        </div>
    );
}
