import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NotificationStoreProvider } from "@/zustand/providers/notification-provider";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <NotificationStoreProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <DashboardHeader />
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-6 max-w-5xl mx-auto w-full">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </NotificationStoreProvider>
    );
}
