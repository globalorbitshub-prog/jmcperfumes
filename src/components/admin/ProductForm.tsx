"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  sizeMl: number;
  price: number;
  stock: number;
}

interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  stock: number;
  description: string;
  descriptionLong: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  wallapopUrl: string;
  vintedUrl: string;
  seoDescription: string;
  seoKeywords: string;
  published: boolean;
  featured: boolean;
  imageUrls: string[];
  imageAlts: string[];
  variants: Variant[];
}

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  price: 0,
  stock: 0,
  description: "",
  descriptionLong: "",
  notesTop: "",
  notesHeart: "",
  notesBase: "",
  wallapopUrl: "",
  vintedUrl: "",
  seoDescription: "",
  seoKeywords: "",
  published: false,
  featured: false,
  imageUrls: [],
  imageAlts: [],
  variants: [],
};

export function ProductForm({ initial }: { initial?: Partial<ProductFormValues> }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateVariant(index: number, patch: Partial<Variant>) {
    const next = [...form.variants];
    next[index] = { ...next[index], ...patch };
    update("variants", next);
  }

  function addVariant() {
    update("variants", [...form.variants, { sizeMl: 0, price: 0, stock: 0 }]);
  }

  function removeVariant(index: number) {
    update(
      "variants",
      form.variants.filter((_, i) => i !== index)
    );
  }

  async function uploadFiles(files: FileList) {
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) newUrls.push(data.url);
      }
      // Functional updates so a slow upload can never clobber other edits
      // made (or a submit that fired) while it was in flight.
      setForm((f) => ({
        ...f,
        imageUrls: [...f.imageUrls, ...newUrls],
        imageAlts: [...f.imageAlts, ...newUrls.map(() => f.name || "Perfume JMC")],
      }));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent, publish?: boolean) {
    e.preventDefault();
    setError(null);

    if (uploading) {
      setError("Espera a que termine de subirse la imagen antes de guardar.");
      return;
    }

    if (form.variants.length > 0) {
      const invalid = form.variants.some((v) => v.sizeMl <= 0 || v.price < 0 || v.stock < 0);
      if (invalid) {
        setError("Revisa las variantes: el tamaño debe ser mayor que 0, y precio/stock no pueden ser negativos.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        published: publish === undefined ? form.published : publish,
      };
      const url = form.id ? `/api/admin/products/${form.id}` : "/api/admin/products";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar.");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => onSubmit(e)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
        <Field label="Nombre *">
          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Slug">
          <input
            value={form.slug}
            placeholder={slugify(form.name)}
            onChange={(e) => update("slug", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Categoría">
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="input"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={form.variants.length > 0 ? "Precio base (no se usa)" : "Precio (€) *"}>
            <input
              required={form.variants.length === 0}
              disabled={form.variants.length > 0}
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => update("price", parseFloat(e.target.value))}
              className="input disabled:opacity-50"
            />
          </Field>
          <Field label={form.variants.length > 0 ? "Stock base (no se usa)" : "Stock *"}>
            <input
              required={form.variants.length === 0}
              disabled={form.variants.length > 0}
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => update("stock", parseInt(e.target.value, 10))}
              className="input disabled:opacity-50"
            />
          </Field>
        </div>

        <div className="border border-border rounded p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-primary text-sm">Variantes de tamaño (ml) — opcional</h3>
            <button type="button" onClick={addVariant} className="text-secondary text-xs underline">
              + Añadir tamaño
            </button>
          </div>
          <p className="text-xs text-primary/50">
            Úsalo para decants u otros formatos con varios tamaños y precios (ej. 2ml, 5ml, 10ml). Si añades
            al menos uno, el precio/stock de arriba se ignora y el cliente elige el tamaño en la ficha del producto.
          </p>
          {form.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center">
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="ml"
                value={v.sizeMl || ""}
                onChange={(e) => updateVariant(i, { sizeMl: parseFloat(e.target.value) || 0 })}
                className="input"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio €"
                value={v.price || ""}
                onChange={(e) => updateVariant(i, { price: parseFloat(e.target.value) || 0 })}
                className="input"
              />
              <input
                type="number"
                min="0"
                placeholder="Stock"
                value={v.stock || ""}
                onChange={(e) => updateVariant(i, { stock: parseInt(e.target.value, 10) || 0 })}
                className="input"
              />
              <button type="button" onClick={() => removeVariant(i)} className="text-error text-xs">
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <Field label="Descripción corta *">
          <textarea
            required
            maxLength={500}
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Descripción larga">
          <textarea
            maxLength={2000}
            rows={5}
            value={form.descriptionLong}
            onChange={(e) => update("descriptionLong", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Notas de salida">
            <input value={form.notesTop} onChange={(e) => update("notesTop", e.target.value)} className="input" />
          </Field>
          <Field label="Notas de corazón">
            <input value={form.notesHeart} onChange={(e) => update("notesHeart", e.target.value)} className="input" />
          </Field>
          <Field label="Notas de fondo">
            <input value={form.notesBase} onChange={(e) => update("notesBase", e.target.value)} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="URL Wallapop">
            <input value={form.wallapopUrl} onChange={(e) => update("wallapopUrl", e.target.value)} className="input" />
          </Field>
          <Field label="URL Vinted">
            <input value={form.vintedUrl} onChange={(e) => update("vintedUrl", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Meta description (SEO)">
          <textarea rows={2} value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} className="input" />
        </Field>
        <Field label="Keywords (separadas por coma)">
          <input value={form.seoKeywords} onChange={(e) => update("seoKeywords", e.target.value)} className="input" />
        </Field>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} />
            Publicado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
            Destacado
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            disabled={saving || uploading}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
            className="border border-secondary text-secondary rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={(e) => onSubmit(e as unknown as React.FormEvent, true)}
            className="bg-secondary hover:bg-accent transition text-white rounded py-2 px-4 text-sm disabled:opacity-50"
          >
            {saving ? "Guardando..." : uploading ? "Subiendo imagen..." : "Publicar"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-border rounded p-4">
          <h3 className="font-medium text-primary mb-2">Vista previa</h3>
          <div className="rounded border border-border overflow-hidden">
            {form.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrls[0]} alt="" className="w-full h-56 object-cover" />
            ) : (
              <div className="w-full h-56 bg-border/40 flex items-center justify-center text-primary/40 text-sm">
                Sin imagen
              </div>
            )}
            <div className="p-3">
              <div className="font-medium text-primary">{form.name || "Nombre del producto"}</div>
              {form.variants.length > 0 ? (
                <div className="text-accent font-heading text-lg">
                  Desde{" "}
                  {Math.min(...form.variants.map((v) => v.price || Infinity)) === Infinity
                    ? "0,00"
                    : Math.min(...form.variants.map((v) => v.price || Infinity)).toFixed(2)}{" "}
                  €
                </div>
              ) : (
                <div className="text-accent font-heading text-lg">
                  {form.price ? `${form.price.toFixed(2)} €` : "0,00 €"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded p-4">
          <h3 className="font-medium text-primary mb-2">Imágenes (máx. 10)</h3>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || form.imageUrls.length >= 10}
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            className="text-sm mb-3"
          />
          {uploading && <p className="text-sm text-primary/60">Subiendo y comprimiendo...</p>}
          <div className="grid grid-cols-3 gap-2">
            {form.imageUrls.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => {
                    update(
                      "imageUrls",
                      form.imageUrls.filter((_, idx) => idx !== i)
                    );
                    update(
                      "imageAlts",
                      form.imageAlts.filter((_, idx) => idx !== i)
                    );
                  }}
                  className="absolute top-1 right-1 bg-error text-white rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-primary/50 mt-2">
            La primera imagen será la portada. Se comprimen automáticamente a WebP.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e8e3dc;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #8b6f9e;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-primary mb-1">{label}</label>
      {children}
    </div>
  );
}
