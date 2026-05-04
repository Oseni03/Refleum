"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getCurrentUser = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const currentUser = await prisma.user.findFirst({
        where: { id: session.user.id },
        include: {
            twofactors: true,
        },
    });

    if (!currentUser) {
        redirect("/sign-in");
    }

    return {
        ...session,
        currentUser,
    };
};

export const getActiveSessions = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                success: false,
                message: "Not authenticated",
            };
        }

        const sessions = await prisma.session.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            data: sessions,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to fetch sessions",
        };
    }
};

export const revokeOtherSessions = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                success: false,
                message: "Not authenticated",
            };
        }

        // Delete all sessions except the current one
        await prisma.session.deleteMany({
            where: {
                userId: session.user.id,
                id: {
                    not: session.session.id,
                },
            },
        });

        return {
            success: true,
            message: "Other sessions revoked successfully",
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to revoke sessions",
        };
    }
};

export const getTwoFactorStatus = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                success: false,
                message: "Not authenticated",
            };
        }

        const user = await prisma.user.findFirst({
            where: { id: session.user.id },
            select: {
                twoFactorEnabled: true,
                twofactors: true,
            },
        });

        return {
            success: true,
            data: {
                enabled: user?.twoFactorEnabled || false,
                hasSetup: (user?.twofactors?.length || 0) > 0,
            },
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Failed to fetch 2FA status",
        };
    }
};

export const changePassword = async (
    currentPassword: string,
    newPassword: string,
) => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                success: false,
                message: "Not authenticated",
            };
        }

        // BetterAuth handles password change with verification
        await auth.api.changePassword({
            body: {
                currentPassword,
                newPassword,
            },
            headers: await headers(),
        });

        return {
            success: true,
            message: "Password changed successfully",
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to change password",
        };
    }
};
