import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
    getDashboardStats,
    getDashboardChartData,
    getRecentResumes,
    getRecentActivity,
} from "@/server/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = {
    title: "Dashboard | Refleum AI",
    description: "Overview of your resume tailoring activity, usage analytics, and subscription status.",
};

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/sign-in");

    const organizationId = session.activeOrganizationId;
    if (!organizationId) redirect("/sign-in");

    const [stats, chartData, recentResumes, recentActivity] = await Promise.all([
        getDashboardStats(organizationId),
        getDashboardChartData(organizationId),
        getRecentResumes(organizationId),
        getRecentActivity(organizationId),
    ]);

    return (
        <DashboardClient
            user={session.user}
            stats={stats}
            chartData={chartData}
            recentResumes={recentResumes}
            recentActivity={recentActivity}
        />
    );
}
