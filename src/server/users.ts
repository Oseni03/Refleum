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
	});

	if (!currentUser) {
		redirect("/sign-in");
	}

	return {
		...session,
		currentUser,
	};
};

export const signIn = async (email: string, password: string) => {
	try {
		await auth.api.signInEmail({
			body: {
				email,
				password,
			},
		});

		return {
			success: true,
			message: "Signed in successfully.",
		};
	} catch (error) {
		const e = error as Error;

		return {
			success: false,
			message: e.message || "An unknown error occurred.",
		};
	}
};

export const signUp = async ({
	email,
	password,
	username,
}: {
	email: string;
	password: string;
	username: string;
}) => {
	try {
		await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: username,
			},
		});

		return {
			success: true,
			message: "Signed up successfully.",
		};
	} catch (error) {
		const e = error as Error;

		return {
			success: false,
			message: e.message || "An unknown error occurred.",
		};
	}
};

export const getUsers = async (organizationId: string) => {
	try {
		const members = await prisma.member.findMany({
			where: { organizationId },
		});

		const users = await prisma.user.findMany({
			where: {
				id: { notIn: members.map((member) => member.userId) },
			},
		});

		return users;
	} catch (error) {
		console.error(error);
		return [];
	}
};

export const getUser = async (userId: string) => {
	try {
		const user = await prisma.user.findFirst({
			where: { id: userId },
		});

		return { success: true, data: user };
	} catch (error) {
		console.error(error);
		return { success: false, error };
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
