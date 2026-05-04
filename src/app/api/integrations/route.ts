import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIntegrations } from "@/server/integrations";

export async function GET(request: NextRequest) {
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

		const result = await getIntegrations(session.activeOrganizationId);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 500 });
		}

		return NextResponse.json({ integrations: result.data });
	} catch (error) {
		console.error("Error in integrations API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
