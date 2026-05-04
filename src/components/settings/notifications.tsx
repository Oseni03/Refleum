import React from 'react'
import { Mail, Monitor, Sparkles } from 'lucide-react'
import { Switch } from '../ui/switch'

export default function Notifications() {
    return (
        <section className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose which communications you receive from the platform.
                </p>
            </div>
            <div className="w-full md:w-2/3 bg-card border border-border rounded-xl p-6 shadow-sm">
                {/* Your existing Notifications content */}
                <div className="space-y-6">
                    {/* Email, Push, New Features toggles... (unchanged) */}
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-all group">
                        <div className="flex gap-4 items-center">
                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Mail className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest mb-1">Email Notifications</p>
                                <p className="text-xs text-muted-foreground font-medium opacity-60">Weekly reports and app updates via email.</p>
                            </div>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-all group">
                        <div className="flex gap-4 items-center">
                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Monitor className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest mb-1">
                                    Push Notifications
                                </p>
                                <p className="text-xs text-muted-foreground font-medium opacity-60">
                                    Browser notifications for mentions and
                                    direct messages.
                                </p>
                            </div>
                        </div>
                        <Switch className="data-[state=checked]:bg-primary" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-all group">
                        <div className="flex gap-4 items-center">
                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest mb-1">
                                    New Features
                                </p>
                                <p className="text-xs text-muted-foreground font-medium opacity-60">
                                    Release notes and feature rollouts.
                                </p>
                            </div>
                        </div>
                        <Switch
                            defaultChecked
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
