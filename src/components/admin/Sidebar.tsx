"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/orders", label: "Órdenes" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/subscribers", label: "Newsletter" },
  { href: "/admin/settings", label: "Configuración" },
  { href: "/admin/settings/admins", label: "Admins", superAdminOnly: true },
  { href: "/admin/audit-logs", label: "Auditoría", superAdminOnly: true },
  { href: "/admin/support", label: "Soporte" },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <nav className="w-56 shrink-0 bg-primary text-cream min-h-screen p-4 space-y-1">
      <div className="font-heading text-lg mb-6 px-2">JMC Admin</div>
      {NAV.filter((item) => !item.superAdminOnly || role === "super_admin").map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "block rounded px-3 py-2 text-sm transition hover:bg-secondary/30",
            pathname.startsWith(item.href) && "bg-secondary/50 font-medium"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
