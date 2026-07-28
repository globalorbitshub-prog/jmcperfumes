"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyTwoFactorForm() {
  const router = useRouter();
  const params = useSearchParams();
  const challenge = params.get("challenge") || "";
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, code, useBackupCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Código incorrecto.");
        return;
      }
      router.push(data.mustChangePassword ? "/auth/change-password" : "/admin/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-heading text-xl text-primary mb-2">Verificación en dos pasos</h2>
      <p className="text-sm text-primary/70">
        Introduce el código de tu autenticador{useBackupCode ? " de recuperación" : ""}.
      </p>
      {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
      <input
        type="text"
        required
        autoFocus
        maxLength={useBackupCode ? 10 : 6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={useBackupCode ? "Código de recuperación" : "123456"}
        className="w-full border border-border rounded px-3 py-2 text-center tracking-widest font-mono outline-none focus:border-secondary transition"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Verificando..." : "Verificar"}
      </button>
      <button
        type="button"
        onClick={() => setUseBackupCode((v) => !v)}
        className="w-full text-sm text-secondary underline"
      >
        {useBackupCode ? "Usar código del autenticador" : "Usar código de recuperación"}
      </button>
    </form>
  );
}

export default function VerifyTwoFactorPage() {
  return (
    <Suspense>
      <VerifyTwoFactorForm />
    </Suspense>
  );
}
