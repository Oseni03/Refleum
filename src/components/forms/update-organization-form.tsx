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
import { Loader2, Zap } from "lucide-react";
import { Organization } from "@/types";
import { DialogFooter } from "@/components/ui/dialog";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    slug: z.string().min(2, "Slug must be at least 2 characters").max(50),
});

export function UpdateOrganizationForm({
    organization,
    onSuccess,
}: {
    organization: Organization;
    onSuccess?: () => void;
}) {
    const { updateOrganization } = useOrganizationStore((state) => state);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: organization.name,
            slug: organization.slug,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            toast.loading("Updating organization...");
            setIsLoading(true);

            const { success } = await updateOrganization(organization.id, values);

            if (success) {
                toast.dismiss();
                toast.success("Organization updated successfully");
                onSuccess?.();
            } else {
                toast.dismiss();
                toast.error("Failed to update organization");
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Failed to update organization");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
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
                                        placeholder="Acme Inc"
                                        {...field}
                                        className="h-14 bg-card border border-border/60 rounded-xl 
                                                   text-sm font-semibold 
                                                   focus:border-primary/50 focus:ring-4 focus:ring-primary/10 
                                                   hover:border-border transition-all duration-200"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] font-medium" />
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
                                        placeholder="acme-inc"
                                        {...field}
                                        className="h-14 bg-card border border-border/60 rounded-xl 
                                                   text-sm font-semibold 
                                                   focus:border-primary/50 focus:ring-4 focus:ring-primary/10 
                                                   hover:border-border transition-all duration-200"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] font-medium" />
                            </FormItem>
                        )}
                    />
                </div>

                <DialogFooter className="pt-6 border-t border-border">
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="w-full h-14 rounded-xl font-medium uppercase text-[11px] tracking-widest 
                                   bg-primary text-primary-foreground 
                                   shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 
                                   active:scale-[0.985] transition-all duration-200"
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <Zap className="size-4 mr-2" />
                                Update Organization
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
