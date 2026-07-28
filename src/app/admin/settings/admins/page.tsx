"use client";

import { useEffect, useState } from "react";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login: string | null;
}

const TABS = [
  { key: "active", label: "Activos" },
  { key: "pending_validation", label: "Pendientes Validación" },
  { key: "suspended", label: "Suspendidos" },
];

export default function AdminsPage() {
  const [tab, setTab] = useState("active");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/admins");
    const data = await res.json();
    setAdmins(data.admins || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: string, extra?: Record<string, unknown>) {
    await fetch(`/api/admin/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    load();
  }

  const filtered = admins.filter((a) => a.status === tab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-primary">Gestión de admins</h1>
        <button onClick={() => setShowCreate(true)} className="bg-secondary hover:bg-accent transition text-white rounded px-4 py-2 text-sm">
          + Crear admin
        </button>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded text-sm ${
              tab === t.key ? "bg-secondary text-white" : "bg-white border border-border text-primary"
            }`}
          >
            {t.label} ({admins.filter((a) => a.status === t.key).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary/60 border-b border-border">
              <th className="p-3">Email</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Último login</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3">
                  <select
                    defaultValue={a.role}
                    onChange={(e) => act(a.id, "change_role", { role: e.target.value })}
                    className="border border-border rounded px-2 py-1 text-xs"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderador</option>
                  </select>
                </td>
                <td className="p-3 text-primary/60">{a.last_login ? new Date(a.last_login).toLocaleString("es-ES") : "-"}</td>
                <td className="p-3 space-x-2 text-xs">
                  {tab === "pending_validation" && (
                    <>
                      <button onClick={() => act(a.id, "approve")} className="text-success underline">
                        Aprobar
                      </button>
                      <button onClick={() => act(a.id, "reject")} className="text-error underline">
                        Rechazar
                      </button>
                    </>
                  )}
                  {tab === "active" && (
                    <>
                      <button onClick={() => act(a.id, "suspend")} className="text-warning underline">
                        Suspender
                      </button>
                      <button onClick={() => act(a.id, "reset_2fa")} className="text-secondary underline">
                        Reestablecer 2FA
                      </button>
                    </>
                  )}
                  {tab === "suspended" && (
                    <button onClick={() => act(a.id, "reactivate")} className="text-success underline">
                      Reactivar
                    </button>
                  )}
                  <button onClick={() => act(a.id, "delete")} className="text-error underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-primary/50">
                  No hay admins en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", name: "", role: "admin", sendInvite: true });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear.");
        return;
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded p-6 w-full max-w-md space-y-4">
        <h3 className="font-heading text-lg text-primary">Crear nuevo admin</h3>
        {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm" />
        <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm">
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderador</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.sendInvite} onChange={(e) => setForm({ ...form, sendInvite: e.target.checked })} />
          Enviar invitación por email
        </label>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border rounded py-2 text-sm">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-secondary text-white rounded py-2 text-sm">
            {saving ? "Creando..." : "Crear admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
