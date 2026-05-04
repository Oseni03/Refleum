import React from "react";
import Header from "@/components/homepage/header";
import Footer from "@/components/homepage/footer";
import { siteConfig } from "@/config/site";
import { Twitter, Linkedin, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
	title: `Contact Us - ${siteConfig.name}`,
	description: `Get in touch with the ${siteConfig.name} team.`,
};

export default function ContactPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className="flex-1">
				<section className="py-24 px-4 bg-background">
					<div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
						<div className="space-y-4 text-center">
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
								Get in Touch
							</h1>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
								Have questions? We&apos;d love to hear from you.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{/* Social Channels */}
							<div className="space-y-8">
								<h3 className="text-2xl font-semibold">
									Social Channels
								</h3>
								<div className="space-y-4">
									<a
										href={siteConfig.links.x}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all group"
									>
										<div className="size-12 rounded-xl bg-foreground text-background flex items-center justify-center group-hover:scale-110 transition-transform">
											<Twitter className="size-6 fill-current" />
										</div>
										<div>
											<p className="font-bold">
												Follow us on X
											</p>
											<p className="text-sm text-muted-foreground">
												Latest updates and news
											</p>
										</div>
									</a>

									<a
										href={siteConfig.links.linkedin}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all group"
									>
										<div className="size-12 rounded-xl bg-[#0077B5] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
											<Linkedin className="size-6 fill-current" />
										</div>
										<div>
											<p className="font-bold">
												LinkedIn
											</p>
											<p className="text-sm text-muted-foreground">
												Professional network & insights
											</p>
										</div>
									</a>
								</div>
							</div>

							{/* Direct Support */}
							<div className="space-y-8">
								<h3 className="text-2xl font-semibold">
									Support
								</h3>
								<div className="p-8 rounded-3xl border border-border bg-primary/5 space-y-6">
									<div className="space-y-2">
										<div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
											<Mail className="size-5" />
										</div>
										<h4 className="font-bold text-lg">
											Email Support
										</h4>
										<p className="text-sm text-muted-foreground">
											Reach out directly for technical
											assistance or business inquiries.
										</p>
									</div>
									<Button className="w-full h-12 rounded-xl gap-2 font-bold uppercase tracking-widest text-xs">
										<MessageSquare className="size-4" />
										Send a Message
									</Button>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
