"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductRowActions({
  id,
  published,
  featured,
}: {
  id: string;
  published: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(field: "published" | "featured", value: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "No se pudo actualizar el producto. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
    } catch {
      alert("Fallo de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este producto? Esta acción se puede revertir por soporte.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "No se pudo eliminar el producto. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
    } catch {
      alert("Fallo de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <a href={`/admin/products/${id}/edit`} className="text-secondary hover:underline">
        Editar
      </a>
      <button disabled={loading} onClick={() => toggle("published", !published)} className="text-primary/70 hover:underline">
        {published ? "Ocultar" : "Publicar"}
      </button>
      <button disabled={loading} onClick={() => toggle("featured", !featured)} className="text-primary/70 hover:underline">
        {featured ? "Quitar destacado" : "Destacar"}
      </button>
      <button disabled={loading} onClick={remove} className="text-error hover:underline">
        Eliminar
      </button>
    </div>
  );
}
