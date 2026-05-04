"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { Camera, Loader2, Zap } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { User } from "@/types";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    title: z.string().max(100, "Title is too long").optional().or(z.literal("")),
    bio: z.string().max(500, "Bio must be under 500 characters").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof formSchema>;

export function ProfileForm({ user }: { user: User }) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: user.name || "", title: user.title || "", bio: user.bio || "" },
    });

    const onSubmit = async (values: ProfileFormValues) => {
        setIsLoading(true);
        try {
            toast.loading("Saving profile...");

            const { error } = await authClient.updateUser({
                name: values.name,
                title: values.title,
                bio: values.bio,
            });

            if (error) throw error;

            toast.dismiss();
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <Avatar className="size-24 rounded-full border-4 border-muted/30 shadow-xl transition-transform group-hover:scale-[1.02]">
                            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                            <AvatarFallback className="text-xl font-medium bg-primary/5 text-primary">
                                {user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <Button className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
                            <Camera className="size-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 rounded-lg font-medium text-xs uppercase tracking-wider"
                        >
                            Change Photo
                        </Button>
                        <p className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground opacity-50">
                            JPG, GIF or PNG. Max 2MB.
                        </p>
                    </div>
                </div>

                {/* Name & Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                    Full Name
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Your Name"
                                        className="h-12 bg-muted/20 border-border/40 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                    Title / Role
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. Lead Designer"
                                        className="h-12 bg-muted/20 border-border/40 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Bio */}
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                About You
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    className="min-h-[120px] bg-muted/20 border-border/40 rounded-xl font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all py-3 px-4 resize-none"
                                />
                            </FormControl>
                            <FormMessage />
                            <p className="text-[10px] font-medium text-muted-foreground opacity-50">
                                Brief description for your profile. URLs are hyperlinked.
                            </p>
                        </FormItem>
                    )}
                />

                {/* Save Button for Profile */}
                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={isLoading || form.formState.isSubmitting}
                        className="h-14 px-10 rounded-xl bg-primary text-primary-foreground font-medium uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-[0.98] transition-all"
                    >
                        {isLoading || form.formState.isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Zap className="size-4 fill-current" />
                        )}
                        Save Profile
                    </Button>
                </div>
            </form>
        </Form>
    );
}