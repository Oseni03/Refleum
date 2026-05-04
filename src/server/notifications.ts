"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // your auth setup
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function getNotifications(limit = 10) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.user?.id || !session.activeOrganizationId) throw new Error("Unauthorized");

    return await prisma.notification.findMany({
        where: { organizationId: session.activeOrganizationId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

export async function markAsRead(notificationId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.user?.id || !session.activeOrganizationId) throw new Error("Unauthorized");

    await prisma.notification.update({
        where: { id: notificationId, organizationId: session.activeOrganizationId },
        data: { read: true },
    });

    revalidatePath("/dashboard/notifications");
}

export async function markAllAsRead() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.user?.id || !session.activeOrganizationId) throw new Error("Unauthorized");

    await prisma.notification.updateMany({
        where: { organizationId: session.activeOrganizationId, read: false },
        data: { read: true },
    });

    revalidatePath("/dashboard/notifications");
}

export async function deleteNotification(notificationId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.user?.id || !session.activeOrganizationId) throw new Error("Unauthorized");

    await prisma.notification.delete({
        where: { id: notificationId, organizationId: session.activeOrganizationId },
    });

    revalidatePath("/dashboard/notifications");
}