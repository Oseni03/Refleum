import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Member, User } from "@/types";
import { Invitation } from '@prisma/client';
import { Button } from '../ui/button';

interface MembersTableProps {
    filteredMembers: Member[];
    pendingInvites: Invitation[];
    isAdmin: boolean;
    user: User;
    handleRemoveMember: (memberId: string) => void;
    handleCancelInvite: (invitationId: string) => void;
    setSelectedMember: (member: Member | null) => void;
    setIsUpdateRoleOpen: (isOpen: boolean) => void;
}

function MembersTable({
    filteredMembers,
    pendingInvites,
    isAdmin,
    user,
    handleRemoveMember,
    handleCancelInvite,
    setSelectedMember,
    setIsUpdateRoleOpen,
}: MembersTableProps) {
    return (
        <div className="bg-background rounded-[32px] border border-border/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-muted/10 border-b border-border/40">
                            <th className="px-10 py-5 text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                Member
                            </th>
                            <th className="px-10 py-5 text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                Email
                            </th>
                            <th className="px-10 py-5 text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                Role
                            </th>
                            <th className="px-10 py-5 text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                                Status
                            </th>
                            <th className="px-10 py-5 text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {/* Active Members */}
                        {filteredMembers?.map((member) => (
                            <tr
                                key={member.id}
                                className="hover:bg-muted/5 transition-colors group"
                            >
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-9 border border-border/40 shadow-sm rounded-xl">
                                            <AvatarImage
                                                src={member.user.image}
                                            />
                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-medium">
                                                {member.user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground tracking-tight">
                                                {member.user.name}
                                            </span>
                                            {member.userId === user?.id && (
                                                <span className="text-[9px] font-medium text-primary uppercase tracking-widest opacity-60">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="text-xs font-medium  opacity-60">
                                        {member.user.email}
                                    </span>
                                </td>
                                <td className="px-10 py-6">
                                    <Badge
                                        variant={
                                            member.role === "admin"
                                                ? "default"
                                                : "outline"
                                        }
                                        className={cn(
                                            "rounded-lg text-[9px] font-medium uppercase px-2.5 py-1 tracking-widest shadow-none transition-all",
                                            member.role === "admin"
                                                ? "bg-primary text-primary-foreground"
                                                : " border-border/40 bg-muted/5",
                                        )}
                                    >
                                        {member.role === "owner"
                                            ? "admin"
                                            : member.role}
                                    </Badge>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-medium text-foreground uppercase tracking-widest opacity-60">
                                            Active
                                        </span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-9 rounded-xl hover:bg-muted/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="size-4.5 " />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-48 rounded-xl border-border/60 shadow-xl p-2"
                                        >
                                            <DropdownMenuItem
                                                disabled={
                                                    !isAdmin ||
                                                    member.userId ===
                                                    user?.id
                                                }
                                                className="rounded-xl font-bold text-xs py-2.5 px-3"
                                                onClick={() => {
                                                    setSelectedMember(
                                                        member,
                                                    );
                                                    setIsUpdateRoleOpen(
                                                        true,
                                                    );
                                                }}
                                            >
                                                Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive rounded-xl font-bold text-xs py-2.5 px-3 mt-1"
                                                disabled={
                                                    !isAdmin ||
                                                    member.userId ===
                                                    user?.id
                                                }
                                                onClick={() =>
                                                    handleRemoveMember(
                                                        member.id,
                                                    )
                                                }
                                            >
                                                Remove Member
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}

                        {/* Pending Invites */}
                        {pendingInvites?.map((invite) => (
                            <tr
                                key={invite.id}
                                className="bg-muted/5 hover:bg-muted/10 transition-colors group"
                            >
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4 opacity-50">
                                        <Avatar className="size-9 border border-border/40 border-dashed rounded-xl">
                                            <AvatarFallback className="bg-transparent  text-[10px] font-medium">
                                                ?
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium  uppercase tracking-wider">
                                            Pending
                                        </span>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="text-xs font-bold  opacity-30">
                                        {invite.email}
                                    </span>
                                </td>
                                <td className="px-10 py-6">
                                    <Badge
                                        variant="outline"
                                        className="rounded-lg text-[9px] font-medium uppercase px-2.5 py-1 tracking-widest /30 border-dashed border-border/40 bg-transparent"
                                    >
                                        {invite.role}
                                    </Badge>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-2.5 /30">
                                        <Clock className="size-3.5 animate-pulse" />
                                        <span className="text-[10px] font-medium uppercase tracking-widest">
                                            Invitation Sent
                                        </span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive font-medium uppercase text-[10px] tracking-widest hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() =>
                                            handleCancelInvite(invite.id)
                                        }
                                        disabled={!isAdmin}
                                    >
                                        Cancel
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-10 py-5 bg-muted/5 border-t border-border/30 flex justify-between items-center">
                <p className="text-[10px] font-medium  uppercase tracking-[0.2em] opacity-40">
                    TOTAL MEMBERS:{" "}
                    {(filteredMembers?.length || 0) +
                        (pendingInvites?.length || 0)}
                </p>
            </div>
        </div>
    )
}

export default MembersTable