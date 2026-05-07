import { Subscription } from "@prisma/client";

export interface User {
    role?: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
    title?: string | null;
    bio?: string | null;
    theme?: string | null;
}

export interface MemberUser {
    email: string;
    name: string;
    image?: string;
}

export interface Member {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
    user: MemberUser;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    subscription?: Subscription;
    createdAt: Date;
    logo?: string | null;
}

export interface InvitationData {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    teamId?: string;
    status: "pending" | "accepted" | "rejected" | "cancelled";
    createdAt: string;
    expiresAt: string;
}

export * from "./resume";
export * from "./enrichment";
export * from "./api";
export * from "./subscription";
export * from "./cover-letter";
export * from "./outreach";