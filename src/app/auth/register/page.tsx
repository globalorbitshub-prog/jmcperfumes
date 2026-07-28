"use client";

import { useState } from "react";

export default function RegisterAdminPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrar.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-2">
        <h2 className="font-heading text-xl text-primary">Solicitud enviada</h2>
        <p className="text-sm text-primary/70">
          Tu solicitud de admin está en revisión. Recibirás un email cuando sea aprobada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-heading text-xl text-primary mb-2">Solicitar acceso de admin</h2>
      {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
      <input
        type="text"
        required
        placeholder="Nombre completo"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
      />
      <input
        type="password"
        required
        placeholder="Contraseña (min. 12 caracteres)"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Solicitar acceso"}
      </button>
    </form>
  );
}
