import { getSupabaseAdmin } from "@/lib/supabase";

export interface CartLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface QuoteLine {
  productId: string;
  variantId: string | null;
  name: string;
  sizeMl: number | null;
  price: number;
  quantity: number;
  stock: number;
}

export interface QuoteResult {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  lines: QuoteLine[];
}

export async function computeQuote(lines: CartLineInput[], country: string): Promise<QuoteResult> {
  const supabase = getSupabaseAdmin();
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));
  const variantIds = lines.filter((l) => l.variantId).map((l) => l.variantId as string);

  const [{ data: products }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, stock, product_weight")
      .in("id", productIds)
      .eq("published", true),
    variantIds.length > 0
      ? supabase.from("product_variants").select("id, product_id, size_ml, price, stock").in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; product_id: string; size_ml: number; price: number; stock: number }[] }),
  ]);

  const quoteLines: QuoteLine[] = lines.map((l) => {
    const product = products?.find((p) => p.id === l.productId);
    if (!product) throw new Error(`Producto no disponible: ${l.productId}`);

    if (l.variantId) {
      const variant = variants?.find((v) => v.id === l.variantId && v.product_id === l.productId);
      if (!variant) throw new Error(`Variante no disponible para ${product.name}`);
      if (variant.stock < l.quantity) throw new Error(`Sin stock suficiente de ${product.name} (${variant.size_ml}ml)`);
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        sizeMl: Number(variant.size_ml),
        price: Number(variant.price),
        quantity: l.quantity,
        stock: variant.stock,
      };
    }

    if (product.stock < l.quantity) throw new Error(`Sin stock suficiente de ${product.name}`);
    return {
      productId: product.id,
      variantId: null,
      name: product.name,
      sizeMl: null,
      price: Number(product.price),
      quantity: l.quantity,
      stock: product.stock,
    };
  });

  const subtotal = quoteLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const weightByProduct = new Map(products?.map((p) => [p.id, Number(p.product_weight || 0.5)]));
  const totalWeight = quoteLines.reduce(
    (sum, l) => sum + (weightByProduct.get(l.productId) || 0.5) * l.quantity,
    0
  );

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
