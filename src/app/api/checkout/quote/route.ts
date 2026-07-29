import { NextRequest, NextResponse } from "next/server";
import { computeQuote } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = body?.items;
  const country = body?.country || "ES";
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }

  try {
    const quote = await computeQuote(
      items.map((i: { productId: string; variantId?: string | null; quantity: number }) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      })),
      country
    );
    return NextResponse.json({ quote });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
