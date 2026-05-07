import { Metadata } from "next";
import { ApiKeysClient } from "@/components/api-keys/api-keys-client";

export const metadata: Metadata = {
    title: "API Keys - Dashboard",
    description: "Manage your API keys for programmatic access.",
};

export default function ApiKeysPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
                <p className="text-muted-foreground">
                    Manage API keys to access the AI Resume Builder API programmatically.
                </p>
            </div>
            <ApiKeysClient />
        </div>
    );
}
