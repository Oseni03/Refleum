import { Github } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Integration } from "@prisma/client";

const integrations = [
    {
        id: "github",
        name: "GitHub",
        description:
            "Sync pull requests, issues, and deployments with your workspace tasks.",
        icon: Github,
        iconColor: "#000000",
        category: "Developer Tools",
    },
];

export interface IntegrationStatus {
    [id: string]: boolean;
}

export function useIntegrations() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Featured");
    const [connectedIntegrations, setConnectedIntegrations] =
        useState<IntegrationStatus>({});
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
    const [integrationToDisconnect, setIntegrationToDisconnect] = useState<
        string | null
    >(null);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const response = await fetch("/api/integrations");
            if (response.ok) {
                const data = await response.json();
                const status: IntegrationStatus = {};
                data.integrations.forEach((integration: Integration) => {
                    status[integration.provider] = true;
                });
                setConnectedIntegrations(status);
            }
        } catch (error) {
            console.error("Failed to fetch integrations:", error);
            toast.error("Failed to load integrations");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (providerId: string) => {
        setConnecting(providerId);
        try {
            const response = await fetch("/api/integrations/oauth/initiate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ provider: providerId }),
            });

            if (response.ok) {
                const data = await response.json();
                // Open OAuth URL in new window
                window.open(data.url, "_blank", "width=600,height=700");
            } else {
                throw new Error("Failed to initiate OAuth");
            }
        } catch (error) {
            console.error("Failed to connect integration:", error);
            toast.error("Failed to connect integration");
        } finally {
            setConnecting(null);
        }
    };

    const handleDisconnect = async (providerId: string) => {
        setIntegrationToDisconnect(providerId);
        setIsDisconnectDialogOpen(true);
    };

    const confirmDisconnect = async () => {
        if (!integrationToDisconnect) return;

        try {
            const response = await fetch(
                `/api/integrations/${integrationToDisconnect}`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
                setConnectedIntegrations((prev) => ({
                    ...prev,
                    [integrationToDisconnect]: false,
                }));
                toast.success("Integration disconnected successfully");
            } else {
                throw new Error("Failed to disconnect");
            }
        } catch (error) {
            console.error("Failed to disconnect integration:", error);
            toast.error("Failed to disconnect integration");
        } finally {
            setIsDisconnectDialogOpen(false);
            setIntegrationToDisconnect(null);
        }
    };

    // Check for OAuth callback success/error on mount and URL changes
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get("success");
        const error = urlParams.get("error");

        if (success === "connected") {
            toast.success("Integration connected successfully");
            fetchIntegrations();
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname);
        } else if (error) {
            let errorMessage = "Failed to connect integration";
            switch (error) {
                case "oauth_failed":
                    errorMessage = "OAuth authorization failed";
                    break;
                case "missing_params":
                    errorMessage = "Missing authorization parameters";
                    break;
                case "invalid_state":
                    errorMessage = "Invalid authorization state";
                    break;
                case "connection_failed":
                    errorMessage = "Failed to save integration";
                    break;
                case "server_error":
                    errorMessage = "Server error occurred";
                    break;
            }
            toast.error(errorMessage);
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);

    const filteredIntegrations = integrations.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            activeCategory === "Featured" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return {
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        connectedIntegrations,
        loading,
        connecting,
        isDisconnectDialogOpen,
        integrationToDisconnect,
        setIsDisconnectDialogOpen,
        setIntegrationToDisconnect,
        handleConnect,
        handleDisconnect,
        confirmDisconnect,
        filteredIntegrations,
    };
}