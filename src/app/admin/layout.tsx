import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar role={session.role} />
      <div className="flex-1 min-w-0">
        <AdminHeader email={session.email} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
