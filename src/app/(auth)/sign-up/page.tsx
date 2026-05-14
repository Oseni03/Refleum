"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    BrainCircuit,
    ShieldCheck,
    FileOutput,
} from "lucide-react";
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
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

// Features aligned to Refleum AI's resume-tailoring capabilities
const features = [
    {
        icon: BrainCircuit,
        title: "AI That Stays Honest",
        description:
            "Refleum only rewrites what's already on your resume — never adds skills, employers, or metrics you don't have.",
    },
    {
        icon: ShieldCheck,
        title: "Alignment Validation Built In",
        description:
            "Every tailored version is checked against your master resume to catch and remove any fabricated content automatically.",
    },
    {
        icon: FileOutput,
        title: "Resume, Cover Letter & Outreach",
        description:
            "One click produces a tailored resume, a job-specific cover letter, and a cold outreach message — ready to send.",
    },
];

const SignupContent = () => {
    const { user } = authClient.useSession().data || {};
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        if (user) router.push("/dashboard");
    }, [user, router]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            const returnUrl = searchParams.get("callbackUrl") || "/dashboard";

            const { data, error } = await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
                callbackURL: returnUrl,
            });

            if (error) {
                toast.error(error.message || "Failed to create account");
            } else {
                toast.success("Account created successfully!");
                if (data?.user) router.push(returnUrl);
            }
        } catch (error) {
            toast.error("Failed to sign up");
            console.error("Auth error:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* ── Left panel — Refleum AI branding ── */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-foreground text-background overflow-hidden">
                {/* Subtle grid texture */}
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
                            Get started free
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight text-background leading-[1.15]">
                            Tailor your resume.
                            <br />
                            Land the role.
                        </h1>
                        <p className="text-base text-background/60 font-light max-w-xs leading-relaxed">
                            Upload your master resume once. Let Refleum AI do the rest — keyword-matched,
                            honest, and ready to send.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {features.map((f) => (
                            <div key={f.title} className="flex items-start gap-4">
                                <div className="mt-0.5 h-8 w-8 rounded-xl bg-background/10 border border-background/10 flex items-center justify-center shrink-0">
                                    <f.icon className="h-4 w-4 text-background/80" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-background">
                                        {f.title}
                                    </p>
                                    <p className="text-xs text-background/50 font-light mt-0.5">
                                        {f.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <div className="h-px bg-background/10 mb-6" />
                    <p className="text-xs text-background/30 font-light">
                        Free to get started. No credit card required.
                    </p>
                </div>
            </div>

            {/* ── Right panel — sign-up form ── */}
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
                    <span className="font-semibold tracking-tight text-sm">
                        {siteConfig.name}
                    </span>
                </div>

                <div className="w-full max-w-sm space-y-8">
                    {/* Header */}
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Create an account
                        </h2>
                        <p className="text-sm text-muted-foreground font-light">
                            Get started for free — no credit card needed.
                        </p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-5"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Full name
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                <Input
                                                    placeholder="John Doe"
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
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    {...field}
                                                    className="h-11 pl-10 pr-10 bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-foreground/20 placeholder:text-muted-foreground/40"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <p className="text-[11px] text-muted-foreground/50">
                                            Must be at least 8 characters.
                                        </p>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 font-semibold tracking-tight"
                            >
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isLoading ? "Creating account…" : "Create Account"}
                            </Button>
                        </form>
                    </Form>

                    {/* Footer */}
                    <div className="space-y-6">
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                href="/sign-in"
                                className="font-semibold text-foreground hover:underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                        </p>
                        <div className="flex items-center justify-center gap-6">
                            {[
                                { href: "/terms", label: "Terms" },
                                { href: "/privacy", label: "Privacy" },
                                { href: "/contact", label: "Support" },
                            ].map(({ href, label }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-wider"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Signup = () => (
    <Suspense
        fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="size-10 animate-spin text-foreground opacity-20" />
            </div>
        }
    >
        <SignupContent />
    </Suspense>
);

export default Signup;
