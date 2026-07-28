"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  user_name: string;
  user_email: string;
  rating: number;
  text: string;
  response_admin: string | null;
  created_at: string;
  products: { name: string; slug: string } | null;
}

const TABS = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
];

export default function AdminReviewsPage() {
  const [tab, setTab] = useState("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?tab=${tab}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function reply(id: string) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseAdmin: replyDrafts[id] || "" }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-primary">Moderación de reseñas</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded text-sm ${
              tab === t.key ? "bg-secondary text-white" : "bg-white border border-border text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-primary/50 text-sm">Cargando...</p>}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-border rounded p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-primary">{r.products?.name || "Producto"}</span>
              <span className="text-accent">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            </div>
            <div className="text-xs text-primary/60">
              {r.user_name} · {r.user_email} · {new Date(r.created_at).toLocaleDateString("es-ES")}
            </div>
            <p className="text-sm text-primary/90">{r.text}</p>

            {tab === "pending" && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => act(r.id, "approve")} className="text-sm bg-success/20 text-success rounded px-3 py-1">
                  ✓ Aprobar
                </button>
                <button onClick={() => act(r.id, "reject")} className="text-sm bg-error/20 text-error rounded px-3 py-1">
                  ✗ Rechazar
                </button>
              </div>
            )}

            {tab === "approved" && (
              <div className="pt-2 space-y-2">
                <textarea
                  placeholder="Respuesta admin (opcional)"
                  defaultValue={r.response_admin || ""}
                  onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  rows={2}
                  className="w-full border border-border rounded px-3 py-2 text-sm"
                />
                <button onClick={() => reply(r.id)} className="text-sm bg-secondary text-white rounded px-3 py-1">
                  Guardar respuesta
                </button>
              </div>
            )}
          </div>
        ))}
        {!loading && reviews.length === 0 && (
          <p className="text-primary/50 text-sm">No hay reseñas en esta categoría.</p>
        )}
      </div>
    </div>
  );
}
