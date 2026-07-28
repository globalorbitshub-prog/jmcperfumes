"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "paid", "shipped", "delivered", "requested_return", "refunded"];

export function OrderActions({
  orderId,
  status,
  trackingNumber,
  notesAdmin,
}: {
  orderId: string;
  status: string;
  trackingNumber: string | null;
  notesAdmin: string | null;
}) {
  const router = useRouter();
  const [tracking, setTracking] = useState(trackingNumber || "");
  const [notes, setNotes] = useState(notesAdmin || "");
  const [saving, setSaving] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveDetails() {
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: tracking, notesAdmin: notes }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-primary mb-1">Estado</label>
        <select
          value={status}
          disabled={saving}
          onChange={(e) => updateStatus(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm w-full"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-primary mb-1">Número de seguimiento</label>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <div>
        <label className="block text-sm text-primary mb-1">Notas internas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border border-border rounded px-3 py-2 text-sm w-full"
        />
      </div>

      <button
        onClick={saveDetails}
        disabled={saving}
        className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm"
      >
        Guardar
      </button>

      <button
        onClick={() => setShowRefund(true)}
        className="w-full border border-error text-error rounded py-2 text-sm"
      >
        Procesar devolución
      </button>

      {showRefund && (
        <RefundModal orderId={orderId} onClose={() => setShowRefund(false)} />
      )}
    </div>
  );
}

function RefundModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState("cambio de opinión");
  const [description, setDescription] = useState("");
  const [processRefund, setProcessRefund] = useState(true);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description, processRefund }),
      });
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded p-6 w-full max-w-md space-y-4">
        <h3 className="font-heading text-lg text-primary">Procesar devolución</h3>
        <div>
          <label className="block text-sm text-primary mb-1">Motivo</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="border border-border rounded px-3 py-2 text-sm w-full">
            <option value="cambio de opinión">Cambio de opinión</option>
            <option value="defecto">Defecto del producto</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-primary mb-1">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="border border-border rounded px-3 py-2 text-sm w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={processRefund} onChange={(e) => setProcessRefund(e.target.checked)} />
          Procesar reembolso en Stripe
        </label>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded py-2 text-sm">
            Cancelar
          </button>
          <button onClick={confirm} disabled={saving} className="flex-1 bg-error text-white rounded py-2 text-sm">
            {saving ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
