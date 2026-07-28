"use client";

import { useRouter } from "next/navigation";

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <header className="sticky top-0 z-10 bg-cream border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="text-sm text-primary/60">Panel de administración</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-primary">{email}</span>
        <button
          onClick={logout}
          className="text-sm text-secondary hover:text-accent transition underline"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
