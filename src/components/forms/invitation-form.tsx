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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["admin", "member"]),
});

export function InvitationForm({ onSuccess }: { onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { inviteMember, activeOrganization: organization } =
        useOrganizationStore((state) => state);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", role: "member" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            toast.loading("Sending invitation...");
            setIsLoading(true);

            if (!organization) return;

            const { success, error } = await inviteMember(organization.id, {
                email: values.email,
                role: values.role,
            });

            if (success) {
                toast.dismiss();
                toast.success(`Invitation sent to ${values.email}`);
                onSuccess();
            } else {
                toast.dismiss();
                toast.error(error || "Failed to send invitation");
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Failed to send invitation");
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
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                    Email Address
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="user@example.com"
                                        {...field}
                                        className="h-14 bg-card border border-border/60 rounded-xl text-sm font-semibold 
                                                   focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                    Role
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 bg-card border border-border/60 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-primary/10">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-border shadow-xl">
                                        <SelectItem value="member" className="rounded-xl py-3 font-medium">
                                            Member
                                        </SelectItem>
                                        <SelectItem value="admin" className="rounded-xl py-3 font-medium">
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <DialogFooter className="pt-6 border-t border-border">
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="w-full h-14 rounded-xl font-medium uppercase text-[11px] tracking-widest 
                                   bg-primary text-primary-foreground shadow-lg shadow-primary/10 
                                   hover:shadow-primary/20 active:scale-[0.985] transition-all duration-200"
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <Send className="size-4" />
                                <span>Send Invitation</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}