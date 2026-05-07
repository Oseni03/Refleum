import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ApiKey } from "@better-auth/api-key";

export function useApiKeys() {
    const { data: session } = authClient.useSession();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadKeys = async () => {
        setIsLoading(true);
        try {
            // Wait, better auth might not expose listing keys like this.
            // But per PRD and build-api workflow, maybe we need a dedicated route?
            // Actually BetterAuth plugin does provide list API or something?
            // "Client methods: authClient.apiKey.* from src/lib/auth-client.ts only."
            // Let's use it:
            const { data } = await authClient.apiKey.list();
            if (data) {
                setApiKeys(data.apiKeys as ApiKey[]);
            }
        } catch (error) {
            toast.error("Failed to load API keys.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            loadKeys();
        }
    }, [session]);

    const handleCreateKey = async (name?: string) => {
        setIsCreating(true);
        try {
            const { data, error } = await authClient.apiKey.create({
                name: name || "New API Key",
            });
            if (error) {
                toast.error("Failed to create API key");
            } else if (data) {
                setNewKey(data.key);
                setIsCreateOpen(true);
                loadKeys();
                toast.success("API key created");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevoke = async (keyId: string) => {
        try {
            const { error } = await authClient.apiKey.delete({ keyId });
            if (error) {
                toast.error("Failed to revoke key");
            } else {
                toast.success("API key revoked");
                loadKeys();
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    const copyToClipboard = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
            toast.success("Copied to clipboard");
        }
    };

    return {
        apiKeys,
        isLoading,
        isCreateOpen,
        newKey,
        hasCopied,
        isCreating,
        setIsCreateOpen,
        handleCreateKey,
        handleRevoke,
        copyToClipboard
    }
}