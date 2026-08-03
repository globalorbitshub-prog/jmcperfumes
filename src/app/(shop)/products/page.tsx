import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ProductCard } from "@/components/shop/ProductCard";
import { withVariantPricing } from "@/lib/products-display";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo de Perfumes",
  description: "Explora nuestra colección de perfumes premium para mujer, hombre y unisex.",
};

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = getSupabaseAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("order");

  let categoryId: string | undefined;
  if (searchParams.category) {
    categoryId = categories?.find((c) => c.slug === searchParams.category)?.id;
  }

  let query = supabase
    .from("products")
    .select("id, name, slug, price, stock, image_urls, featured, category_id")
    .eq("published", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (searchParams.search) query = query.ilike("name", `%${searchParams.search}%`);
  if (searchParams.minPrice) query = query.gte("price", Number(searchParams.minPrice));
  if (searchParams.maxPrice) query = query.lte("price", Number(searchParams.maxPrice));

  switch (searchParams.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("featured", { ascending: false });
  }

  const { data: productsRaw } = await query;
  const products = await withVariantPricing(productsRaw || []);

  const filtersForm = (
    <form className="space-y-4">
      <input
        type="text"
        name="search"
        defaultValue={searchParams.search}
        placeholder="Buscar perfume..."
        className="w-full border border-border rounded px-3 py-2.5 text-sm"
      />

      <div>
        <div className="text-sm font-medium text-primary mb-2">Categoría</div>
        <select name="category" defaultValue={searchParams.category || ""} className="w-full border border-border rounded px-3 py-2.5 text-sm">
          <option value="">Todas</option>
          {(categories || []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" name="minPrice" defaultValue={searchParams.minPrice} placeholder="Min €" className="border border-border rounded px-3 py-2.5 text-sm" />
        <input type="number" name="maxPrice" defaultValue={searchParams.maxPrice} placeholder="Max €" className="border border-border rounded px-3 py-2.5 text-sm" />
      </div>

      <div>
        <div className="text-sm font-medium text-primary mb-2">Ordenar por</div>
        <select name="sort" defaultValue={searchParams.sort || ""} className="w-full border border-border rounded px-3 py-2.5 text-sm">
          <option value="">Relevancia</option>
          <option value="new">Más nuevo</option>
          <option value="price_asc">Precio ↑</option>
          <option value="price_desc">Precio ↓</option>
        </select>
      </div>

      <button className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2.5 text-sm">
        Aplicar filtros
      </button>
      <a href="/products" className="block text-center text-xs text-primary/50 underline">
        Limpiar filtros
      </a>
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">
        <details className="lg:hidden mb-6 bg-white border border-border rounded">
          <summary className="cursor-pointer select-none px-4 py-3 font-medium text-primary flex items-center justify-between">
            Filtros
            <span aria-hidden>▾</span>
          </summary>
          <div className="px-4 pb-4">{filtersForm}</div>
        </details>
        <div className="hidden lg:block sticky top-20">{filtersForm}</div>
      </aside>

      <div className="lg:col-span-3">
        <h1 className="font-heading text-2xl text-primary mb-6">Catálogo de perfumes</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(products || []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {(products || []).length === 0 && (
          <p className="text-primary/50 text-center py-16">No encontramos perfumes con esos criterios.</p>
        )}
      </div>
    </div>
  );
}
