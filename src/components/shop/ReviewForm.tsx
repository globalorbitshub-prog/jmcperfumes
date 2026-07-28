"use client";

import { useState } from "react";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, userName, userEmail, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar la reseña.");
        return;
      }
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-success bg-success/10 rounded p-3">
        ¡Gracias! Tu reseña aparecerá tras aprobación.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-white border border-border rounded p-4">
      <h3 className="font-medium text-primary">Deja tu reseña</h3>
      {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-accent" : "text-border"}
            aria-label={`${n} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        required
        placeholder="Tu email"
        type="email"
        value={userEmail}
        onChange={(e) => setUserEmail(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 text-sm"
      />
      <input
        required
        placeholder="Tu nombre"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 text-sm"
      />
      <textarea
        maxLength={300}
        rows={3}
        placeholder="Comentario (máx. 300 caracteres)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 text-sm"
      />
      <div className="text-xs text-primary/50 text-right">{text.length}/300</div>
      <button disabled={saving} className="bg-secondary hover:bg-accent transition text-white rounded px-4 py-2 text-sm">
        {saving ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  );
}
