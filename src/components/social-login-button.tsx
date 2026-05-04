"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SocialLoginButton() {
	const searchParams = useSearchParams();
	const [googleLoading, setGoogleLoading] = useState(false);

	const signInWithGoogle = async () => {
		try {
			setGoogleLoading(true);
			const returnUrl = searchParams.get("callbackUrl") || "/dashboard";

			const { data, error } = await authClient.signIn.social({
				provider: "google",
				callbackURL: returnUrl,
			});

			if (error) {
				toast.error(error.message || "Error during Google sign-in");
			} else if (data?.url) {
				toast.success("Redirecting to Google...");
				window.location.href = data.url;
			}
		} catch (error) {
			console.error("Error during Google sign-in:", error);
			toast.error("Failed to sign in with Google");
		} finally {
			setGoogleLoading(false);
		}
	};
	return (
		<div className="grid grid-cols-2 gap-4">
			<Button
				variant="outline"
				onClick={signInWithGoogle}
				disabled={googleLoading}
				className="h-13 flex items-center justify-center gap-3 bg-muted/10 border-border/40 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-muted/30 active:scale-[0.98] transition-all group/google"
			>
				{googleLoading ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<>
						<svg
							className="size-4 transition-transform group-hover/google:scale-110"
							viewBox="0 0 24 24"
						>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="currentColor"
								className="text-[#4285F4]"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="currentColor"
								className="text-[#34A853]"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
								fill="currentColor"
								className="text-[#FBBC05]"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
								fill="currentColor"
								className="text-[#EA4335]"
							/>
						</svg>
						Google
					</>
				)}
			</Button>
			<Button
				disabled={googleLoading}
				variant="outline"
				className="h-13 flex items-center justify-center gap-3 bg-muted/20 border-border/50 rounded-xl text-[10px] font-medium uppercase tracking-widest hover:bg-accent hover:shadow-sm transition-all"
			>
				<Fingerprint className="size-4 transition-transform group-hover/biometric:scale-110" />
				Passkey
			</Button>
		</div>
	);
}
