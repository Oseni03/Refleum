import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import FeedbackEmail from "@/components/emails/feedback-email";

interface FeedbackPayload {
	name: string;
	email: string;
	message: string;
}

export async function POST(request: NextRequest) {
	try {
		const body: FeedbackPayload = await request.json();

		// Validate input
		if (!body.name?.trim()) {
			return NextResponse.json(
				{ success: false, message: "Name is required" },
				{ status: 400 },
			);
		}

		if (!body.email?.trim()) {
			return NextResponse.json(
				{ success: false, message: "Email is required" },
				{ status: 400 },
			);
		}

		if (!body.message?.trim()) {
			return NextResponse.json(
				{ success: false, message: "Message is required" },
				{ status: 400 },
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return NextResponse.json(
				{ success: false, message: "Invalid email format" },
				{ status: 400 },
			);
		}

		const feedbackEmail = process.env.FEEDBACK_EMAIL;
		if (!feedbackEmail) {
			console.error("FEEDBACK_EMAIL environment variable is not set");
			return NextResponse.json(
				{
					success: false,
					message: "Feedback service is not configured",
				},
				{ status: 500 },
			);
		}

		// Send email
		const { success, error } = await sendEmail({
			to: feedbackEmail,
			subject: `New Feedback from ${body.name}`,
			react: FeedbackEmail(body),
		});

		if (!success) {
			console.error("Failed to send feedback email:", error);
			return NextResponse.json(
				{ success: false, message: "Failed to send feedback" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				message: "Feedback sent successfully",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Feedback submission error:", error);
		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
