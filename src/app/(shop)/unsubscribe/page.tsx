"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeContent() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/subscribers/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al desuscribirte.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      {done ? (
        <>
          <h1 className="font-heading text-2xl text-primary mb-2">Listo</h1>
          <p className="text-primary/70">No recibirás más emails de JMC Perfumes.</p>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-left">
          <h1 className="font-heading text-2xl text-primary text-center mb-2">Darse de baja</h1>
          <p className="text-sm text-primary/70 text-center">{email}</p>
          {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            Deseo desuscribirme
          </label>
          <button
            type="submit"
            disabled={!confirmed}
            className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm disabled:opacity-50"
          >
            Confirmar desuscripción
          </button>
        </form>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
