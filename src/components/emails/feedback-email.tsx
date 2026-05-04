import * as React from "react";
import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
	Tailwind,
} from "@react-email/components";

interface FeedbackPayload {
	name: string;
	email: string;
	message: string;
}

const FeedbackEmail = (props: FeedbackPayload) => {
	const { name, email, message } = props;

	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head />
				<Preview>New feedback from {name}</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="bg-white mx-auto p-[40px] rounded-[8px] max-w-[600px]">
						<Section>
							<Heading className="text-[24px] font-bold text-gray-900 mb-[24px] mt-0">
								New Feedback Received
							</Heading>

							<Section className="mb-[24px] p-[20px] bg-blue-50 rounded-[6px] border-l-[4px] border-solid border-blue-500">
								<Text className="text-[16px] text-gray-900 mb-[8px] mt-0">
									<strong>From:</strong> {name}
								</Text>
								<Text className="text-[16px] text-gray-900 mb-[16px] mt-0">
									<strong>Email:</strong> {email}
								</Text>
								<Text className="text-[14px] text-gray-600 mb-[4px] mt-0">
									<strong>Submitted:</strong>{" "}
									{new Date().toLocaleString()}
								</Text>
							</Section>

							<Section className="mb-[32px]">
								<Text className="text-[16px] font-semibold text-gray-900 mb-[12px] mt-0">
									Message:
								</Text>
								<Section className="p-[20px] bg-gray-50 rounded-[6px] border border-solid border-gray-200">
									<Text className="text-[16px] text-gray-800 mt-0 leading-[24px] whitespace-pre-wrap">
										{message}
									</Text>
								</Section>
							</Section>

							<Section className="border-t border-solid border-gray-200 pt-[24px]">
								<Text className="text-[14px] text-gray-500 mb-[8px] mt-0">
									<strong>Next Steps:</strong>
								</Text>
								<Text className="text-[14px] text-gray-500 mb-[4px] mt-0">
									• Review the feedback and determine
									appropriate action
								</Text>
								<Text className="text-[14px] text-gray-500 mb-[4px] mt-0">
									• Respond to {name} at {email} if a reply is
									needed
								</Text>
								<Text className="text-[14px] text-gray-500 mb-[16px] mt-0">
									• Log this feedback in your tracking system
								</Text>

								<Text className="text-[12px] text-gray-400 m-0">
									This is an automated notification from your
									feedback system.
								</Text>
							</Section>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

FeedbackEmail.PreviewProps = {
	name: "Alex Thompson",
	email: "alex.thompson@example.com",
	message:
		"Hi there!\n\nI've been using your platform for the past few months and overall I'm really impressed with the functionality. However, I noticed that the dashboard loading times can be quite slow during peak hours.\n\nWould it be possible to optimize the performance? Also, it would be great to have a dark mode option.\n\nThanks for building such a great product!\n\nBest regards,\nAlex",
};

export default FeedbackEmail;
