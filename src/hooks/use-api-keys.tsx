import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ApiKey } from "@better-auth/api-key";

export function useApiKeys(initialKeys: ApiKey[]) {
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
    const [newKeyName, setNewKeyName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session || !session.session.activeOrganizationId) {
            toast.error("You must be signed in with an active organization to create an API key");
            return;
        }

        setIsCreating(true);

        try {
            // We remove the explicit userId as Better Auth infers it from the session cookie.
            // Explicitly passing it can sometimes trigger stricter server-side checks that cause UNAUTHORIZED_SESSION.
            const { data, error } = await authClient.apiKey.create({
                name: newKeyName || `Key ${keys.length + 1}`,
                organizationId: session.session.activeOrganizationId,
            })

            if (error) {
                toast.error(error.message || "Failed to create API key")
            }

            if (data) {
                setKeys([data, ...keys]);
                setNewlyCreatedKey(data.key);
                setNewKeyName("");
                toast.success("API key generated successfully!");
            }
        } catch (error: any) {
            console.error("API Key creation error:", error);
            toast.error(error.message || "Failed to create API key");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        try {
            const { error } = await authClient.apiKey.delete({
                keyId: id,
            });

            if (error) throw error;

            setKeys(keys.filter((k) => k.id !== id));
            toast.success("API key deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete key");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return {
        keys,
        isCreating,
        newKeyName,
        isSessionLoading,
        newlyCreatedKey,
        setNewKeyName,
        setIsCreating,
        setNewlyCreatedKey,
        handleCreateKey,
        handleDeleteKey,
        copyToClipboard,
    }
}