import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApiKeyManager } from "@/components/api-keys/api-key-manager";
import { ApiKey } from "@better-auth/api-key";
import { siteConfig } from "@/config/site";

export default async function ApiKeysPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    let apiKeys: ApiKey[]

    if (session.activeOrganizationId) {
        apiKeys = await prisma.apikey.findMany({
            where: { referenceId: session.activeOrganizationId },
            orderBy: { createdAt: "desc" },
        }) as ApiKey[]
    } else {
        apiKeys = []
    }

    // Cast Prisma Date to string as needed for JS object transfer (though BetterAuth types might handle it)
    const formattedKeys = apiKeys.map((key) => ({
        ...key,
        // Prisma returns Date objects, but for client components we might need to handle serializability 
        // if not using Next.js 14+ RSC to Client boundary features correctly.
        // However, standard Next.js 14 RSC to Client can handle Date objects.
    }));

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">API Management</h1>
                <p className="text-sm text-muted-foreground font-light">
                    Manage your access tokens for the {siteConfig.name} verification service.
                </p>
            </header>

            <ApiKeyManager initialKeys={formattedKeys as any} />
        </div>
    );
}
