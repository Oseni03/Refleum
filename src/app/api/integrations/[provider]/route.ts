import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	disconnectIntegration,
	IntegrationProvider,
} from "@/server/integrations";

export async function DELETE(request: NextRequest) {
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

		const { searchParams } = new URL(request.url);
		const provider = searchParams.get("provider") as IntegrationProvider;

		if (!provider) {
			return NextResponse.json(
				{ error: "Provider is required" },
				{ status: 400 },
			);
		}

		const result = await disconnectIntegration(
			session.activeOrganizationId,
			provider,
		);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error disconnecting integration:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
