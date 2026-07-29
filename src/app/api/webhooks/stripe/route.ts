import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { sendMail } from "@/lib/email";
import { generateOrderNumber } from "@/lib/utils";

export const runtime = "nodejs";

interface MetadataLine {
  id: string;
  vid: string | null;
  n: string;
  ml: number | null;
  q: number;
  p: number;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Firma inválida: ${(err as Error).message}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_payment_id", pi.id)
      .maybeSingle();
    if (existingOrder) return NextResponse.json({ received: true }); // already processed

    const meta = pi.metadata;
    const lines: MetadataLine[] = JSON.parse(meta.lines || "[]");
    const customerEmail = meta.customerEmail;

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01`);
    const orderNumber = generateOrderNumber((count || 0) + 1);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        number: orderNumber,
        user_email: customerEmail,
        user_name: meta.customerName,
        user_phone: meta.customerPhone,
        address: meta.address,
        city: meta.city,
        postal_code: meta.postalCode,
        country: meta.country,
        products_json: lines.map((l) => ({
          product_id: l.id,
          variant_id: l.vid || null,
          product_name: l.ml ? `${l.n} (${l.ml}ml)` : l.n,
          size_ml: l.ml || null,
          quantity: l.q,
          price_at_order: l.p,
        })),
        subtotal: Number(meta.subtotal),
        tax: Number(meta.tax),
        shipping: Number(meta.shipping),
        total: Number(meta.total),
        stripe_payment_id: pi.id,
        status: "paid",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create order from webhook", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const line of lines) {
      if (line.vid) {
        await supabase.rpc("decrement_variant_stock", { v_id: line.vid, v_qty: line.q }).then(async (res) => {
          if (res.error) {
            const { data: variant } = await supabase.from("product_variants").select("stock").eq("id", line.vid).maybeSingle();
            if (variant) {
              await supabase
                .from("product_variants")
                .update({ stock: Math.max(0, variant.stock - line.q) })
                .eq("id", line.vid);
            }
          }
        });
      } else {
        await supabase.rpc("decrement_product_stock", { p_id: line.id, p_qty: line.q }).then(async (res) => {
          if (res.error) {
            // Fallback if the RPC function doesn't exist yet — non-atomic but functional.
            const { data: product } = await supabase.from("products").select("stock").eq("id", line.id).maybeSingle();
            if (product) {
              await supabase
                .from("products")
                .update({ stock: Math.max(0, product.stock - line.q) })
                .eq("id", line.id);
            }
          }
        });
      }
    }

    await supabase.from("order_holds").delete().eq("user_email", customerEmail);

    await sendMail({
      to: customerEmail,
      subject: `Compra confirmada - Pedido ${orderNumber}`,
      html: `<p>Hola ${meta.customerName},</p><p>Tu pedido <strong>${orderNumber}</strong> ha sido confirmado. Total: ${meta.total}€.</p><p>Te avisaremos cuando sea enviado.</p>`,
    });

    const { data: storeEmailSetting } = await supabase.from("settings").select("value").eq("key", "store_email").maybeSingle();
    const storeEmail = (storeEmailSetting?.value as string) || undefined;
    if (storeEmail) {
      await sendMail({
        to: storeEmail,
        subject: `Nueva orden: ${orderNumber}`,
        html: `<p>Nueva orden de ${meta.customerName} (${customerEmail}) por ${meta.total}€.</p>`,
      });
    }

    return NextResponse.json({ received: true, orderId: order.id });
  }

  if (event.type === "charge.refunded" || event.type === "refund.updated") {
    // Refunds initiated directly in the Stripe dashboard also get reflected here.
    const object = event.data.object as Stripe.Charge | Stripe.Refund;
    const paymentIntentId =
      "payment_intent" in object && typeof object.payment_intent === "string" ? object.payment_intent : null;
    if (paymentIntentId) {
      await supabase.from("orders").update({ status: "refunded" }).eq("stripe_payment_id", paymentIntentId);
    }
  }

  return NextResponse.json({ received: true });
}
