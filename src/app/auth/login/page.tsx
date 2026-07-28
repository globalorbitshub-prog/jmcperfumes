"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión.");
        return;
      }
      if (data.requires2faSetup) {
        router.push(`/auth/setup-2fa?challenge=${encodeURIComponent(data.challenge)}`);
      } else {
        router.push(`/auth/verify-2fa?challenge=${encodeURIComponent(data.challenge)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-heading text-xl text-primary mb-2">Iniciar sesión</h2>
      {error && (
        <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>
      )}
      <div>
        <label className="block text-sm text-primary mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
        />
      </div>
      <div>
        <label className="block text-sm text-primary mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 outline-none focus:border-secondary transition"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
