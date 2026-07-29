"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon: icon || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la categoría.");
        return;
      }
      setName("");
      setIcon("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta categoría? Los productos que la usen se quedarán sin categoría.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl text-primary">Categorías</h1>

      <form onSubmit={create} className="bg-white border border-border rounded p-4 max-w-md space-y-3">
        <h2 className="font-medium text-primary">Nueva categoría</h2>
        {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
        <div>
          <label className="block text-sm text-primary mb-1">Nombre *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Decants"
            className="w-full border border-border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-primary mb-1">Icono (emoji, opcional)</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Ej. 🧴"
            className="w-full border border-border rounded px-3 py-2 text-sm"
          />
        </div>
        <button disabled={saving} className="bg-secondary hover:bg-accent transition text-white rounded px-4 py-2 text-sm">
          {saving ? "Creando..." : "Crear categoría"}
        </button>
      </form>

      <div className="bg-white rounded border border-border overflow-x-auto max-w-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary/60 border-b border-border">
              <th className="p-3">Categoría</th>
              <th className="p-3">Slug</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  {c.icon && <span className="mr-1">{c.icon}</span>}
                  {c.name}
                </td>
                <td className="p-3 text-primary/60 font-mono text-xs">{c.slug}</td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(c.id)} className="text-error text-xs underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-primary/50">
                  Todavía no hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
