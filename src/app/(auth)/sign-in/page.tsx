"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Zap, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const features = [
    {
        icon: ShieldCheck,
        title: "Secure by Default",
        description: "End-to-end encrypted sessions with industry-standard auth flows.",
    },
    {
        icon: Zap,
        title: "Instant Access",
        description: "Pick up right where you left off — no friction, no delays.",
    },
    {
        icon: Globe,
        title: "Available Everywhere",
        description: "Access your account from any device, anywhere in the world.",
    },
];

const LoginContent = () => {
    const { user } = authClient.useSession().data || {};
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (user) router.push("/dashboard");
    }, [user, router]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            const returnUrl = searchParams.get("callbackUrl") || "/dashboard";

            const { data, error } = await authClient.signIn.email({
                email: values.email,
                password: values.password,
                callbackURL: returnUrl,
            });

            if (error) {
                toast.error(error.message || "Invalid login credentials");
            } else {
                toast.success("Signed in successfully!");
                if (data?.redirect) router.push(data.url || returnUrl);
                else router.push(returnUrl);
            }
        } catch (error) {
            toast.error("Failed to sign in");
            console.error("Auth error:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-foreground text-background overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundSize: "40px 40px",
                        backgroundImage:
                            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                    }}
                />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center">
                        <Image
                            src={siteConfig.logoUrl}
                            alt={`${siteConfig.name} logo`}
                            width={16}
                            height={16}
                            className="h-4 w-4 object-contain"
                        />
                    </div>
                    <span className="text-background font-semibold tracking-tight text-sm">
                        {siteConfig.name}
                    </span>
                </div>

                {/* Headline + features */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/40">
                            Welcome back
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight text-background leading-[1.15]">
                            Good to see
                            <br />
                            you again.
                        </h1>
                        <p className="text-base text-background/60 font-light max-w-xs leading-relaxed">
                            Sign in to pick up where you left off and keep building.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {features.map((f) => (
                            <div key={f.title} className="flex items-start gap-4">
                                <div className="mt-0.5 h-8 w-8 rounded-xl bg-background/10 border border-background/10 flex items-center justify-center shrink-0">
                                    <f.icon className="h-4 w-4 text-background/80" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-background">{f.title}</p>
                                    <p className="text-xs text-background/50 font-light mt-0.5">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <div className="h-px bg-background/10 mb-6" />
                    <p className="text-xs text-background/30 font-light">
                        Trusted by thousands of teams worldwide.
                    </p>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-8 py-12">
                {/* Mobile logo */}
                <div className="lg:hidden mb-8 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
                        <Image
                            src={siteConfig.logoUrl}
                            alt={`${siteConfig.name} logo`}
                            width={16}
                            height={16}
                            className="h-4 w-4 object-contain"
                        />
                    </div>
                    <span className="font-semibold tracking-tight text-sm">{siteConfig.name}</span>
                </div>

                <div className="w-full max-w-sm space-y-8">
                    {/* Header */}
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                        <p className="text-sm text-muted-foreground font-light">
                            Sign in to your account to continue.
                        </p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Email address
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                <Input
                                                    placeholder="name@company.com"
                                                    {...field}
                                                    className="h-11 pl-10 bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-foreground/20 placeholder:text-muted-foreground/40"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Password
                                            </FormLabel>
                                            <Link
                                                href="#"
                                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                    className="h-11 pl-10 bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-foreground/20 placeholder:text-muted-foreground/40"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 font-semibold tracking-tight"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                {isLoading ? "Signing in…" : "Sign In"}
                            </Button>
                        </form>
                    </Form>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-semibold text-foreground hover:underline underline-offset-4"
                        >
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const Login = () => (
    <Suspense
        fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="size-10 animate-spin text-foreground opacity-20" />
            </div>
        }
    >
        <LoginContent />
    </Suspense>
);

export default Login;
