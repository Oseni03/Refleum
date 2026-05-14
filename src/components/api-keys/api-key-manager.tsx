"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Plus,
    Copy,
    Trash2,
    Key,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useApiKeys } from "@/hooks/use-api-keys";
import { ApiKey } from "@better-auth/api-key";

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
    const {
        keys,
        isCreating,
        newKeyName,
        isSessionLoading,
        newlyCreatedKey,
        setNewKeyName,
        setNewlyCreatedKey,
        handleCreateKey,
        handleDeleteKey,
        copyToClipboard,
    } = useApiKeys(initialKeys)

    return (
        <div className="space-y-12 max-w-4xl">
            {/* Newly Created Key Dialog */}
            <Dialog open={!!newlyCreatedKey} onOpenChange={(open) => {
                if (!open) setNewlyCreatedKey(null)
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            API Key Created
                        </DialogTitle>
                        <DialogDescription>
                            Please copy your new API key now. For your security, it will never be shown again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="grid flex-1 gap-2">
                            <Input
                                id="new-key"
                                value={newlyCreatedKey || ""}
                                readOnly
                                className="font-mono text-sm bg-muted/50"
                            />
                        </div>
                        <Button type="button" size="icon" className="px-3 shrink-0" onClick={() => {
                            if (newlyCreatedKey) copyToClipboard(newlyCreatedKey)
                        }}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setNewlyCreatedKey(null)}
                        >
                            I have copied it safely
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Key Card */}
            <section className="space-y-4">
                <Card className="border border-border bg-background shadow-none rounded-xl">
                    <CardContent className="p-6">
                        <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2 w-full group">
                                <Label htmlFor="key-name" className="text-[10px] font-bold uppercase tracking-wider text-foreground group-focus-within:text-primary transition-colors">Key Label</Label>
                                <Input
                                    id="key-name"
                                    placeholder="e.g. Production Environment"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="h-10 bg-muted/20 border-border focus:bg-background transition-all"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isCreating || isSessionLoading}
                                className="w-full sm:w-auto h-10 px-6 font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                {isCreating || isSessionLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Generate Token
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </section>

            {/* Keys List */}
            <section className="space-y-4 pt-4 border-t border-border/50">
                <div className="px-1 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Active Tokens</h2>
                    <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full font-mono uppercase border border-border/50">{keys.length} Total</span>
                </div>

                {keys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                        <AlertCircle className="h-10 w-10 text-muted-foreground/10 mb-4 font-light" />
                        <p className="text-xs text-muted-foreground font-light">You haven&apos;t generated any API keys yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {keys.map((apiKey) => (
                            <Card key={apiKey.id} className="border border-border bg-background shadow-none rounded-xl group transition-all hover:border-primary/20">
                                <CardContent className="p-0">
                                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2 min-w-0 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                                    <Key className="h-4 w-4 text-primary opacity-60" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold tracking-tight text-foreground">{apiKey.name || "Unnamed Key"}</span>
                                                    <p className="text-[10px] text-muted-foreground font-light flex items-center gap-1">
                                                        Created on {new Date(apiKey.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1 group/code">
                                                <div className="relative flex-1 group">
                                                    <code className="block w-full bg-muted/30 px-3 py-2 rounded-lg text-xs font-mono text-muted-foreground border border-border/50 group-hover:border-primary/20 transition-all">
                                                        {(apiKey as any).start || "ba_" }••••••••••••••••••••••••
                                                    </code>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                        onClick={() => handleDeleteKey(apiKey.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
