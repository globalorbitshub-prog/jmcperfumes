"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cambiar la contraseña.");
        return;
      }
      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-heading text-xl text-primary mb-2">Cambiar contraseña</h2>
      <p className="text-sm text-primary/70">
        Debes establecer una contraseña nueva antes de continuar.
      </p>
      {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
      <input
        type="password"
        required
        placeholder="Contraseña actual / temporal"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
      />
      <input
        type="password"
        required
        placeholder="Nueva contraseña (min. 12 caracteres)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
      />
      <input
        type="password"
        required
        placeholder="Confirmar nueva contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
