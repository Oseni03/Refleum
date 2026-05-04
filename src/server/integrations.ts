import { prisma } from "@/lib/prisma";

export type IntegrationProvider = "github";

export interface IntegrationConfig {
	clientId: string;
	clientSecret: string;
	scopes: string[];
	authUrl: string;
	tokenUrl: string;
	redirectUri: string;
}

export const INTEGRATION_CONFIGS: Record<
	IntegrationProvider,
	IntegrationConfig
> = {
	github: {
		clientId: process.env.GITHUB_CLIENT_ID!,
		clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		scopes: ["repo", "user"],
		authUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`,
	},
};

export async function getIntegrations(organizationId: string) {
	try {
		const integrations = await prisma.integration.findMany({
			where: { organizationId },
		});

		return {
			success: true,
			data: integrations,
		};
	} catch (error) {
		console.error("Error fetching integrations:", error);
		return {
			success: false,
			error: "Failed to fetch integrations",
		};
	}
}

export async function getIntegration(
	organizationId: string,
	provider: IntegrationProvider,
) {
	try {
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_provider: {
					organizationId,
					provider,
				},
			},
		});

		return {
			success: true,
			data: integration,
		};
	} catch (error) {
		console.error("Error fetching integration:", error);
		return {
			success: false,
			error: "Failed to fetch integration",
		};
	}
}

export async function connectIntegration(
	organizationId: string,
	provider: IntegrationProvider,
	tokens: {
		accessToken: string;
		refreshToken?: string;
		expiresAt?: Date;
		scope?: string;
		metadata?: string;
	},
) {
	try {
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_provider: {
					organizationId,
					provider,
				},
			},
			update: {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiresAt: tokens.expiresAt,
				scope: tokens.scope,
				metadata: tokens.metadata,
				updatedAt: new Date(),
			},
			create: {
				organizationId,
				provider,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiresAt: tokens.expiresAt,
				scope: tokens.scope,
				metadata: tokens.metadata,
			},
		});

		return {
			success: true,
			data: integration,
		};
	} catch (error) {
		console.error("Error connecting integration:", error);
		return {
			success: false,
			error: "Failed to connect integration",
		};
	}
}

export async function disconnectIntegration(
	organizationId: string,
	provider: IntegrationProvider,
) {
	try {
		await prisma.integration.delete({
			where: {
				organizationId_provider: {
					organizationId,
					provider,
				},
			},
		});

		return {
			success: true,
		};
	} catch (error) {
		console.error("Error disconnecting integration:", error);
		return {
			success: false,
			error: "Failed to disconnect integration",
		};
	}
}

export function getOAuthUrl(
	provider: IntegrationProvider,
	state: string,
): string {
	const config = INTEGRATION_CONFIGS[provider];
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		scope: config.scopes.join(" "),
		response_type: "code",
		state,
	});

	return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
	provider: IntegrationProvider,
	code: string,
): Promise<{
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	scope?: string;
}> {
	const config = INTEGRATION_CONFIGS[provider];

	const response = await fetch(config.tokenUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
		body: new URLSearchParams({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code,
			grant_type: "authorization_code",
			redirect_uri: config.redirectUri,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to exchange code: ${response.statusText}`);
	}

	const data = await response.json();

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: data.expires_in
			? new Date(Date.now() + data.expires_in * 1000)
			: undefined,
		scope: data.scope,
	};
}
