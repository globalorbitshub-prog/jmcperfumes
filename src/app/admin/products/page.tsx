import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatEUR } from "@/lib/utils";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("products")
    .select("id, name, price, stock, published, featured, image_urls")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (searchParams.search) query = query.ilike("name", `%${searchParams.search}%`);
  const { data: products } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-primary">Productos</h1>
        <Link
          href="/admin/products/new"
          className="bg-secondary hover:bg-accent transition text-white rounded px-4 py-2 text-sm"
        >
          + Nuevo producto
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={searchParams.search}
          placeholder="Buscar por nombre..."
          className="border border-border rounded px-3 py-2 text-sm w-64"
        />
        <button className="text-sm border border-border rounded px-3 py-2">Buscar</button>
      </form>

      <div className="bg-white rounded border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary/60 border-b border-border">
              <th className="p-3">Producto</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3 flex items-center gap-3">
                  {p.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_urls[0]} alt="" className="w-10 h-10 object-cover rounded" />
                  )}
                  <span>{p.name}</span>
                </td>
                <td className="p-3">{formatEUR(Number(p.price))}</td>
                <td className="p-3">
                  <span className={p.stock < 5 ? "text-warning font-medium" : ""}>{p.stock}</span>
                </td>
                <td className="p-3">
                  {p.published ? (
                    <span className="text-success text-xs">Publicado</span>
                  ) : (
                    <span className="text-primary/40 text-xs">Borrador</span>
                  )}
                  {p.featured && <span className="ml-2 text-accent text-xs">★ Destacado</span>}
                </td>
                <td className="p-3">
                  <ProductRowActions id={p.id} published={p.published} featured={p.featured} />
                </td>
              </tr>
            ))}
            {(products || []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-primary/50">
                  No hay productos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
