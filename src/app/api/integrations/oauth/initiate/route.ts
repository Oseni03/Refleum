import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	getOAuthUrl,
	INTEGRATION_CONFIGS,
	IntegrationProvider,
} from "@/server/integrations";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session || !session.activeOrganizationId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { provider } = await request.json();

		if (!provider || !Object.keys(INTEGRATION_CONFIGS).includes(provider)) {
			return NextResponse.json(
				{ error: "Invalid provider" },
				{ status: 400 },
			);
		}

		// Create state parameter for security (include org ID and user ID)
		const state = Buffer.from(
			JSON.stringify({
				organizationId: session.activeOrganizationId,
				userId: session.user.id,
				provider,
			}),
		).toString("base64");

		const oauthUrl = getOAuthUrl(provider as IntegrationProvider, state);

		return NextResponse.json({ url: oauthUrl });
	} catch (error) {
		console.error("Error initiating OAuth:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
