"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import {
    Dialog,
    DialogDescription,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { InvitationForm } from "@/components/forms/invitation-form";
import { UpdateMemberRoleForm } from "@/components/forms/update-member-role-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useMembers } from "@/hooks/use-members";
import MembersTable from "@/components/dashboard/members-table";

export default function MembersPage() {
    const {
        isAdmin,
        user,
        isInviteOpen,
        isUpdateRoleOpen,
        selectedMember,
        searchQuery,
        isRemoveDialogOpen,
        memberToRemove,
        filteredMembers,
        pendingInvites,
        handleRemoveMember,
        confirmRemoveMember,
        handleCancelInvite,
        setIsInviteOpen,
        setIsUpdateRoleOpen,
        setSelectedMember,
        setSearchQuery,
        setIsRemoveDialogOpen,
        setMemberToRemove,
    } = useMembers()

    if (!user) return

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header / Controls Section */}
            <div className="bg-background border border-border/60 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold tracking-tighter">
                            Team Members
                        </h2>
                        <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                            Manage your team and permissions
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full sm:w-80 group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5  transition-colors group-focus-within/search:text-primary opacity-40" />
                            <input
                                className="w-full pl-12 pr-4 h-12 bg-muted/20 border-border/40 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:outline-none transition-all placeholder:opacity-30"
                                placeholder="Search for members..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Dialog
                            open={isInviteOpen}
                            onOpenChange={setIsInviteOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    className="w-full sm:w-auto bg-primary text-primary-foreground px-8 h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/10"
                                    disabled={!isAdmin}
                                >
                                    <UserPlus className="size-4" />
                                    <span>Invite Member</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[32px] border-border/60 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold tracking-tighter">
                                        Invite Team Member
                                    </DialogTitle>
                                    <DialogDescription className="text-xs font-medium ">
                                        Send an invitation to join your
                                        organization.
                                    </DialogDescription>
                                </DialogHeader>
                                <InvitationForm
                                    onSuccess={() => setIsInviteOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Update Member Role Dialog */}
            <Dialog open={isUpdateRoleOpen} onOpenChange={setIsUpdateRoleOpen}>
                <DialogContent className="rounded-[32px] border-border/60 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-tighter">
                            Update Member Role
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium ">
                            Change the role for this team member.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedMember && (
                        <UpdateMemberRoleForm
                            defaultValues={{
                                email: selectedMember.user.email,
                                role:
                                    selectedMember.role === "owner"
                                        ? "admin"
                                        : (selectedMember.role as
                                            | "admin"
                                            | "member"),
                            }}
                            memberId={selectedMember.id}
                            onSuccess={() => setIsUpdateRoleOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Members Table */}
            <MembersTable
                filteredMembers={filteredMembers}
                pendingInvites={pendingInvites}
                isAdmin={isAdmin}
                user={user}
                handleRemoveMember={handleRemoveMember}
                handleCancelInvite={handleCancelInvite}
                setSelectedMember={setSelectedMember}
                setIsUpdateRoleOpen={setIsUpdateRoleOpen}
            />

            {/* Remove Member Confirmation Dialog */}
            <AlertDialog
                open={isRemoveDialogOpen}
                onOpenChange={setIsRemoveDialogOpen}
            >
                <AlertDialogContent className="rounded-[32px] border-border/60 shadow-2xl p-10">
                    <AlertDialogHeader className="space-y-6">
                        <AlertDialogTitle className="text-xl font-medium tracking-tighter">
                            Remove Member
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold  p-4 bg-destructive/5 rounded-xl border border-destructive/10 leading-loose">
                            Are you sure you want to remove{" "}
                            <span className="text-foreground font-medium uppercase tracking-widest">
                                {memberToRemove?.user.name}
                            </span>{" "}
                            from the organization? They will lose access to all
                            projects and data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-4">
                        <AlertDialogCancel
                            className="h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest border-border/40 hover:bg-muted/10"
                            onClick={() => {
                                setIsRemoveDialogOpen(false);
                                setMemberToRemove(null);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemoveMember}
                            className="bg-destructive text-destructive-foreground h-12 rounded-xl font-medium uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-destructive/10 active:scale-95"
                        >
                            Remove Member
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
