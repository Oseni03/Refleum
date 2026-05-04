import React, { Suspense } from "react";
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Lock,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SetPasswordForm } from "@/components/forms/set-password-form";
import SecurityCard from "@/components/settings/security";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@/types";
import { ProfileForm } from "@/components/forms/profile-form";
import Notifications from "@/components/settings/notifications";

// Loading fallback component
const SettingsLoading = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
        <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-12">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="w-full md:w-2/3">
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SettingsContent = ({ user }: { user: User }) => (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
        {/* Page Header */}
        <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Profile Settings
            </h1>
            <p className="text-lg text-muted-foreground">
                Manage your public profile and account details.
            </p>
        </div>

        {/* Profile Section */}
        <section className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Profile</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    This information will be displayed publicly so be careful what you share.
                </p>
            </div>

            <div className="w-full md:w-2/3 bg-card border border-border rounded-xl p-6 shadow-sm">
                <ProfileForm user={user} />
            </div>
        </section>

        <Separator className="bg-border/40" />

        {/* Account & Security Section */}
        <section className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Account & Security</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Manage your email, password, and security preferences.
                </p>
            </div>
            <div className="w-full md:w-2/3 bg-card border border-border rounded-xl p-6 shadow-sm space-y-8">
                {/* Email */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] ml-1">
                        Email Address
                    </Label>
                    <div className="flex gap-3">
                        <Input
                            defaultValue={user.email}
                            readOnly
                            className="flex-1 h-12 bg-muted/20 border-border/40 rounded-xl font-bold text-sm opacity-60 grayscale cursor-not-allowed"
                        />
                        <Badge
                            variant="secondary"
                            className="h-12 px-4 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center gap-2"
                        >
                            <ShieldCheck className="size-3" />
                            Verified
                        </Badge>
                    </div>
                </div>

                {/* Change Password */}
                <div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-12 px-6 rounded-xl font-medium uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 hover:bg-muted transition-all"
                            >
                                <Lock className="size-4" />
                                Change Password
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-xl border-border/40 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold tracking-tight text-center pt-4">
                                    Change Password
                                </DialogTitle>
                            </DialogHeader>
                            <div className="p-4">
                                <SetPasswordForm />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </section>

        <Separator className="bg-border/40" />

        {/* Security Card */}
        <section className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Advanced Security</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Manage active sessions and two-factor authentication.
                </p>
            </div>
            <div className="w-full md:w-2/3">
                <SecurityCard />
            </div>
        </section>

        <Separator className="bg-border/40" />

        {/* Notifications Section */}
        <Notifications />
    </div>
)

export default async function SettingsPage() {
    const session = (await auth.api.getSession({
        headers: await headers(),
    })) as Session | null;

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen">
            <Suspense fallback={<SettingsLoading />}>
                <SettingsContent user={session.user} />
            </Suspense>
        </div>
    );
}
