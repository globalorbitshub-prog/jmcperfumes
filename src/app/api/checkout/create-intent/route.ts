import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { computeQuote } from "@/lib/pricing";

const HOLD_MINUTES = 5;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = body?.items as { productId: string; variantId?: string | null; quantity: number }[] | undefined;
  const customer = body?.customer;
  const country = customer?.country || "ES";

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }
  if (!customer?.email || !customer?.name || !customer?.address || !customer?.city || !customer?.postalCode) {
    return NextResponse.json({ error: "Faltan datos del cliente." }, { status: 400 });
  }

  let quote;
  try {
    quote = await computeQuote(items, country);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Clean up expired holds, then re-check stock accounting for active holds by others.
  await supabase.from("order_holds").delete().lt("expires_at", new Date().toISOString());

  for (const line of quote.lines) {
    let holdsQuery = supabase
      .from("order_holds")
      .select("quantity")
      .eq("product_id", line.productId)
      .neq("user_email", customer.email);
    holdsQuery = line.variantId ? holdsQuery.eq("variant_id", line.variantId) : holdsQuery.is("variant_id", null);
    const { data: activeHolds } = await holdsQuery;
    const heldQty = (activeHolds || []).reduce((sum, h) => sum + h.quantity, 0);
    if (line.stock - heldQty < line.quantity) {
      return NextResponse.json(
        { error: `Sin stock suficiente de ${line.name} en este momento.` },
        { status: 409 }
      );
    }
  }

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
  await supabase.from("order_holds").insert(
    quote.lines.map((line) => ({
      product_id: line.productId,
      variant_id: line.variantId,
      user_email: customer.email,
      quantity: line.quantity,
      expires_at: expiresAt,
    }))
  );

  const stripe = getStripe();
  const connectId = process.env.STRIPE_CONNECT_ACCOUNT_ID;
  const commissionPercent = Number(process.env.STRIPE_COMMISSION_PERCENT || 3);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(quote.total * 100),
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    receipt_email: customer.email,
    ...(connectId
      ? {
          transfer_data: {
            destination: connectId,
            amount: Math.round(quote.total * ((100 - commissionPercent) / 100) * 100),
          },
        }
      : {}),
    metadata: {
      customerEmail: customer.email,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      country,
      lines: JSON.stringify(
        quote.lines.map((l) => ({
          id: l.productId,
          vid: l.variantId,
          n: l.name,
          ml: l.sizeMl,
          q: l.quantity,
          p: l.price,
        }))
      ),
      subtotal: String(quote.subtotal),
      tax: String(quote.tax),
      shipping: String(quote.shipping),
      total: String(quote.total),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    quote,
  });
}
