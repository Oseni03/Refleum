import { useState } from "react";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { authClient } from "@/lib/auth-client";
import { Member } from "@/types";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

export function useMembers() {
    const {
        activeOrganization,
        members,
        invitations,
        isAdmin,
        removeMember,
        cancelInvitation,
    } = useOrganizationStore(
        useShallow((state) => ({
            activeOrganization: state.activeOrganization,
            members: state.members,
            invitations: state.invitations,
            isAdmin: state.isAdmin,
            removeMember: state.removeMember,
            cancelInvitation: state.cancelInvitation,
        }))
    );
    const { user } = authClient.useSession().data || {};

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isUpdateRoleOpen, setIsUpdateRoleOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

    const filteredMembers = members?.filter(
        (m) =>
            m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const pendingInvites = invitations?.filter(
        (inv) => inv.status === "pending",
    );

    async function handleRemoveMember(memberId: string) {
        const member = members?.find((m) => m.id === memberId);
        if (member) {
            setMemberToRemove(member);
            setIsRemoveDialogOpen(true);
        }
    }

    async function confirmRemoveMember() {
        if (!memberToRemove || !activeOrganization) return;

        try {
            toast.loading("Removing member...");
            const { success, error } = await removeMember(
                memberToRemove.id,
                activeOrganization.id,
            );
            if (error || !success) {
                toast.dismiss();
                toast.error("Unable to remove member");
            } else {
                toast.dismiss();
                toast.success("Member removed successfully");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to remove member");
        } finally {
            setIsRemoveDialogOpen(false);
            setMemberToRemove(null);
        }
    }

    async function handleCancelInvite(invitationId: string) {
        try {
            toast.loading("Canceling invite...");
            const { success } = await cancelInvitation(invitationId);
            if (!success) {
                toast.dismiss();
                toast.error("Failed to cancel invite");
            } else {
                toast.dismiss();
                toast.success("Invite canceled successfully");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to cancel invite");
        }
    }

    return {
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
    };
}