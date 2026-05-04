"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const formSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

interface SetPasswordFormProps {
    onSuccess?: () => void;
}

export function SetPasswordForm({ onSuccess }: SetPasswordFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            const { data, error } = await authClient.resetPassword({
                newPassword: values.password,
            });

            if (data?.status) {
                toast.success("Password set successfully");
                onSuccess?.();
            } else {
                toast.error(error?.message || "Failed to set password");
            }
        } catch (error) {
            toast.error("Failed to set password");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-muted-foreground">New Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 bg-card border-border rounded-xl focus:ring-primary/10"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-muted-foreground">Confirm Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 bg-card border-border rounded-xl focus:ring-primary/10"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                        <Lock className="size-4 mr-2" />
                    )}
                    Set Password
                </Button>
            </form>
        </Form>
    );
}