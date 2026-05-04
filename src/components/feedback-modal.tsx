"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function FeedbackModal() {
	const [open, setOpen] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(false);
	const [formData, setFormData] = React.useState({
		name: "",
		email: "",
		message: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.name.trim() ||
			!formData.email.trim() ||
			!formData.message.trim()
		) {
			toast.error("Please fill in all fields");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Failed to send feedback");
			}

			toast.success("Thank you! Your feedback has been sent.");
			setFormData({ name: "", email: "", message: "" });
			setOpen(false);
		} catch (error) {
			console.error("Feedback submission error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to send feedback",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button className="group px-5 py-3.5 flex items-center gap-4 transition-all duration-300 rounded-xl mx-2 text-muted-foreground hover:text-foreground font-black hover:bg-sidebar-accent w-full">
					<MessageSquare className="size-5 transition-transform group-hover:scale-110 group-hover:-rotate-3" />
					<span className="text-xs uppercase tracking-[0.1em]">
						Feedback
					</span>
				</button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Send us your feedback</DialogTitle>
					<DialogDescription>
						We&apos;d love to hear your thoughts, suggestions, or
						report any issues.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="Your name"
							value={formData.name}
							onChange={(e) =>
								setFormData({
									...formData,
									name: e.target.value,
								})
							}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="your.email@example.com"
							value={formData.email}
							onChange={(e) =>
								setFormData({
									...formData,
									email: e.target.value,
								})
							}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="message">Message</Label>
						<Textarea
							id="message"
							placeholder="Tell us what you think..."
							rows={5}
							value={formData.message}
							onChange={(e) =>
								setFormData({
									...formData,
									message: e.target.value,
								})
							}
							disabled={isLoading}
							className="resize-none"
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Sending..." : "Send Feedback"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
