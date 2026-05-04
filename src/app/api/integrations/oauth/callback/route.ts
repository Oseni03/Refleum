import { NextRequest, NextResponse } from "next/server";
import {
	exchangeCodeForTokens,
	connectIntegration,
	IntegrationProvider,
} from "@/server/integrations";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error) {
			console.error("OAuth error:", error);
			return NextResponse.redirect(
				new URL(
					"/dashboard/settings?tab=integrations&error=oauth_failed",
					process.env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

		if (!code || !state) {
			return NextResponse.redirect(
				new URL(
					"/dashboard/settings?tab=integrations&error=missing_params",
					process.env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

		// Decode state
		let stateData;
		try {
			stateData = JSON.parse(Buffer.from(state, "base64").toString());
		} catch (err) {
			console.error("Invalid state:", err);
			return NextResponse.redirect(
				new URL(
					"/dashboard/settings?tab=integrations&error=invalid_state",
					process.env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

		const { organizationId, provider } = stateData;

		// Exchange code for tokens
		const tokens = await exchangeCodeForTokens(
			provider as IntegrationProvider,
			code,
		);

		// Store the integration
		const result = await connectIntegration(
			organizationId,
			provider as IntegrationProvider,
			tokens,
		);

		if (!result.success) {
			console.error("Failed to connect integration:", result.error);
			return NextResponse.redirect(
				new URL(
					"/dashboard/settings?tab=integrations&error=connection_failed",
					process.env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

		// Redirect back to integrations page with success
		return NextResponse.redirect(
			new URL(
				"/dashboard/settings?tab=integrations&success=connected",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	} catch (error) {
		console.error("Error in OAuth callback:", error);
		return NextResponse.redirect(
			new URL(
				"/dashboard/settings?tab=integrations&error=server_error",
				process.env.NEXT_PUBLIC_APP_URL,
			),
		);
	}
}
