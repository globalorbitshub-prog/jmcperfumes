import { getSupabaseAdmin } from "@/lib/supabase";

export interface VariantInput {
  sizeMl: number;
  price: number;
  stock: number;
}

// Replaces all variants for a product with the given list (simplest correct
// sync for the small lists admins actually manage — a handful of sizes), and
// keeps products.price/products.stock in sync (min variant price, summed
// stock) so DB-level sorting/filtering on those columns stays sensible.
export async function syncProductVariants(
  productId: string,
  variants: VariantInput[] | undefined
) {
  if (variants === undefined) return; // field not sent: leave existing variants untouched
  const supabase = getSupabaseAdmin();
  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (variants.length === 0) return;
  await supabase.from("product_variants").insert(
    variants.map((v, i) => ({
      product_id: productId,
      size_ml: v.sizeMl,
      price: v.price,
      stock: v.stock,
      order: i,
    }))
  );

  const minPrice = Math.min(...variants.map((v) => v.price));
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  await supabase.from("products").update({ price: minPrice, stock: totalStock }).eq("id", productId);
}
