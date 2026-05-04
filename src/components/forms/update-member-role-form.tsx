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
import { Loader2, Zap } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { DialogFooter } from "../ui/dialog";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

const formSchema = z.object({
    email: z.string().email(),
    role: z.enum(["admin", "member"]),
});

export function UpdateMemberRoleForm({
    defaultValues,
    memberId,
    onSuccess,
}: {
    defaultValues: z.infer<typeof formSchema>;
    memberId: string;
    onSuccess: () => void;
}) {
    const {
        activeOrganization: organization,
        isAdmin,
        updateMemberRole,
    } = useOrganizationStore((state) => state);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            toast.loading("Updating access level...");
            setIsLoading(true);

            if (!organization) return;

            if (!isAdmin) {
                toast.dismiss();
                toast.error("Administrator permissions required to modify access level");
                return;
            }

            const { success } = await updateMemberRole(
                memberId,
                {
                    organizationId: organization.id,
                    role: values.role
                }
            );

            if (!success) {
                toast.dismiss();
                toast.error("Failed to update access level");
                return;
            }

            toast.dismiss();
            toast.success("Access level updated successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Process error in access level update");
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
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">Email Address</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="user@example.com"
                                        {...field}
                                        disabled
                                        className="h-14 bg-card border-border/40 rounded-xl text-sm font-bold focus:ring-primary/10 focus:border-primary/50 transition-all opacity-60 grayscale"
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">Role</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-14 bg-card border-border/40 rounded-xl text-sm font-bold focus:ring-primary/10 focus:border-primary/50 transition-all">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-border/60 shadow-xl">
                                        <SelectItem value="member" className="rounded-xl font-bold text-xs py-3">Member</SelectItem>
                                        <SelectItem value="admin" className="rounded-xl font-bold text-xs py-3">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                        )}
                    />
                </div>

                <DialogFooter className="pt-6 border-t border-border/40">
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="w-full bg-primary text-primary-foreground h-14 rounded-xl font-medium uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Zap className="size-4 fill-current" />
                        )}
                        <span>Update Role</span>
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
