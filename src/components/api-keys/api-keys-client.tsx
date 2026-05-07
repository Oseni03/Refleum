"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Key, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useApiKeys } from "@/hooks/use-api-keys";

export function ApiKeysClient() {
    const {
        apiKeys,
        isLoading,
        isCreateOpen,
        newKey,
        hasCopied,
        isCreating,
        setIsCreateOpen,
        handleCreateKey,
        handleRevoke,
        copyToClipboard
    } = useApiKeys()
    const [name, setName] = useState("");

    const onCreate = async () => {
        if (!name) {
            toast.error("Please enter a name for the API key");
            return;
        }
        await handleCreateKey(name);
        setName("");
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Your API Keys</CardTitle>
                    <CardDescription>
                        Use these keys to authenticate API requests.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Key name (e.g. Production)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="max-w-[200px]"
                    />
                    <Button onClick={onCreate} disabled={isCreating}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Key
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                ) : apiKeys.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No API keys found. Create one to get started.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Key Prefix</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apiKeys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell>{key.name}</TableCell>
                                    <TableCell className="font-mono text-muted-foreground">
                                        {key.prefix}••••••••
                                    </TableCell>
                                    <TableCell>{key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRevoke(key.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={isCreateOpen} onOpenChange={(open) => {
                if (!open && !hasCopied) {
                    // Force copy if required, or just allow close. PRD says blocks close until copied.
                    toast.warning("Please copy your key first!");
                    return;
                }
                setIsCreateOpen(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>API Key Created</DialogTitle>
                        <DialogDescription>
                            Please copy this key now. You won't be able to see it again!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                                {newKey}
                            </div>
                        </div>
                        <Button size="sm" className="px-3" onClick={copyToClipboard}>
                            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsCreateOpen(false)} disabled={!hasCopied}>
                            I have copied the key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
