import React from "react";
import Header from "@/components/homepage/header";
import Footer from "@/components/homepage/footer";
import { siteConfig } from "@/config/site";

export const metadata = {
	title: `About - ${siteConfig.name}`,
	description: `Learn more about ${siteConfig.name} and our mission.`,
};

export default function AboutPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Header />
			<main className="flex-1">
				<section className="py-24 px-4 bg-background">
					<div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
						<div className="space-y-4 text-center">
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
								Our Mission
							</h1>
							<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
								We&apos;re building the foundation for the next
								generation of SaaS applications.
							</p>
						</div>

						<div className="prose prose-zinc dark:prose-invert max-w-none">
							<p className="text-lg leading-relaxed text-foreground/80">
								{siteConfig.name} was born out of the
								frustration of repeating the same boilerplate
								code over and over again. We believe that
								developers should spend their time building
								features that matter, not setting up
								authentication, billing, and database
								connections.
							</p>
							<p className="text-lg leading-relaxed text-foreground/80">
								Our goal is to provide a rock-solid,
								production-ready foundation that follows all the
								best practices, so you can launch your product
								in days instead of months.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-16 not-prose">
								<div className="p-8 rounded-3xl border border-border bg-muted/50 space-y-4">
									<h3 className="text-xl font-bold">
										Velocity
									</h3>
									<p className="text-muted-foreground">
										Go from idea to production faster than
										ever before with pre-built components
										and integrations.
									</p>
								</div>
								<div className="p-8 rounded-3xl border border-border bg-muted/50 space-y-4">
									<h3 className="text-xl font-bold">
										Quality
									</h3>
									<p className="text-muted-foreground">
										Built with industry standards including
										TypeScript, Next.js, and best-in-class
										security practices.
									</p>
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
