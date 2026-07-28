"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  messages_json: { from: string; text: string; at: string }[];
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  async function load() {
    const res = await fetch("/api/admin/support");
    const data = await res.json();
    setTickets(data.tickets || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateTicket(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setReply("");
    load();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-4">Soporte</h1>
        <div className="bg-white rounded border border-border divide-y divide-border">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="w-full text-left p-3 hover:bg-cream text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{t.subject}</span>
                <span className="text-xs text-primary/60">{t.status}</span>
              </div>
              <div className="text-primary/60 text-xs">{t.email}</div>
            </button>
          ))}
          {tickets.length === 0 && <p className="p-4 text-primary/50 text-sm">No hay tickets.</p>}
        </div>
      </div>

      {selected && (
        <div className="bg-white border border-border rounded p-4 space-y-3">
          <h2 className="font-medium text-primary">{selected.subject}</h2>
          <p className="text-sm text-primary/60">{selected.email}</p>
          <p className="text-sm">{selected.message}</p>
          <div className="space-y-2">
            {(selected.messages_json || []).map((m, i) => (
              <div key={i} className="text-sm bg-cream rounded p-2">
                <strong>{m.from}:</strong> {m.text}
              </div>
            ))}
          </div>
          <select
            value={selected.status}
            onChange={(e) => updateTicket(selected.id, { status: e.target.value })}
            className="border border-border rounded px-3 py-2 text-sm"
          >
            <option value="open">Abierto</option>
            <option value="in_progress">En progreso</option>
            <option value="closed">Cerrado</option>
          </select>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Respuesta"
            className="w-full border border-border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => updateTicket(selected.id, { reply })}
            className="bg-secondary text-white rounded px-4 py-2 text-sm"
          >
            Enviar respuesta
          </button>
        </div>
      )}
    </div>
  );
}
