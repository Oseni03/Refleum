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
import { Loader2 } from "lucide-react";
import { DialogFooter } from "../ui/dialog";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

const formSchema = z.object({
    name: z.string().min(2).max(50),
    slug: z.string().min(2).max(50),
});

export function CreateOrganizationForm() {
    const { data } = authClient.useSession();
    const { createOrganization } = useOrganizationStore((state) => state);
    const [isLoading, setIsLoading] = useState(false);

    const user = data?.user;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            slug: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            toast.loading("Creating Organization...");
            setIsLoading(true);

            if (!user) return;

            const { success } = await createOrganization(user.id, values);

            if (!data || !success) {
                toast.dismiss();
                toast.error("Failed to create organization");
                return;
            }
            toast.dismiss();
            toast.success("Organization created successfully");
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Failed to create organization");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                Organization Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="My Organization"
                                    {...field}
                                    className="h-14 bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                Organization Slug
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="my-organization"
                                    {...field}
                                    className="h-14 bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                    )}
                />

                <DialogFooter className="pt-6 border-t border-border/40">
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground h-14 font-medium uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            "Create Organization"
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
