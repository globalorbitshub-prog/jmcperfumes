import { getSupabaseAdmin } from "@/lib/supabase";

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface QuoteResult {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  lines: { productId: string; name: string; price: number; quantity: number; stock: number }[];
}

export async function computeQuote(lines: CartLineInput[], country: string): Promise<QuoteResult> {
  const supabase = getSupabaseAdmin();
  const ids = lines.map((l) => l.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock, product_weight")
    .in("id", ids)
    .eq("published", true);

  const quoteLines = lines.map((l) => {
    const product = products?.find((p) => p.id === l.productId);
    if (!product) throw new Error(`Producto no disponible: ${l.productId}`);
    if (product.stock < l.quantity) throw new Error(`Sin stock suficiente de ${product.name}`);
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: l.quantity,
      stock: product.stock,
      weight: Number(product.product_weight || 0.5),
    };
  });

  const subtotal = quoteLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totalWeight = quoteLines.reduce((sum, l) => sum + l.weight * l.quantity, 0);

  const { data: shippingRate } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("country", country)
    .maybeSingle();
  const { data: taxRate } = await supabase.from("tax_rates").select("*").eq("country", country).maybeSingle();

  const rate = shippingRate || { base_rate: 9.95, rate_per_kg: 2, free_above: 50 };
  const taxPercent = taxRate?.tax_percent ?? 21;

  const shipping =
    subtotal >= Number(rate.free_above) ? 0 : Number(rate.base_rate) + Number(rate.rate_per_kg) * totalWeight;
  const tax = Math.round(subtotal * (Number(taxPercent) / 100) * 100) / 100;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    shipping: Math.round(shipping * 100) / 100,
    total,
    lines: quoteLines,
  };
}
