"use client"

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/server/security";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SecurityForm() {
    // React Hook Form
    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onPasswordSubmit = async (values: PasswordFormValues) => {
        try {
            const result = await changePassword(values.currentPassword, values.newPassword);

            if (result.success) {
                toast.success(result.message || "Password updated successfully");
                form.reset();
            } else {
                toast.error(result.message || "Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred while updating password");
        }
    };
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] ml-1">
                                Current Password
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="••••••••••••"
                                    className="bg-muted/20 border-border/40 h-14 rounded-xl"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] ml-1">
                                    New Password
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        className="bg-muted/20 border-border/40 h-14 rounded-xl"
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
                            <FormItem>
                                <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] ml-1">
                                    Confirm New Password
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        className="bg-muted/20 border-border/40 h-14 rounded-xl"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="pt-8 border-t border-border/40 flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => form.reset()}
                        className="h-14 px-8 font-medium uppercase text-[10px] tracking-widest"
                    >
                        Clear
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="bg-primary text-primary-foreground font-medium uppercase text-[11px] tracking-widest px-10 h-14 rounded-xl"
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}