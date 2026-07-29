import { getSupabaseAdmin } from "@/lib/supabase";

export interface ProductForCard {
  id: string;
  [key: string]: unknown;
}

/**
 * Marks products that have ml-size variants (e.g. decants) with `fromPrice: true`
 * so cards can render "Desde X €" instead of a flat price. products.price/stock
 * are kept in sync with the variants at save time (see lib/admin/variants.ts),
 * so no price/stock override is needed here — just the display flag.
 */
export async function withVariantPricing<T extends ProductForCard>(
  products: T[]
): Promise<(T & { fromPrice?: boolean })[]> {
  if (products.length === 0) return products;
  const supabase = getSupabaseAdmin();
  const { data: variants } = await supabase
    .from("product_variants")
    .select("product_id")
    .in(
      "product_id",
      products.map((p) => p.id)
    );

  if (!variants || variants.length === 0) return products;
  const withVariants = new Set(variants.map((v) => v.product_id));

  return products.map((p) => (withVariants.has(p.id) ? { ...p, fromPrice: true } : p));
}
