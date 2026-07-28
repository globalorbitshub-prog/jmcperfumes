import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { getStripe } from "@/lib/stripe";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const reason: string = body?.reason || "otro";
  const description: string = body?.description || "";
  const processRefund: boolean = !!body?.processRefund;

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });

  let stripeRefundId: string | null = null;
  if (processRefund) {
    if (!order.stripe_payment_id) {
      return NextResponse.json({ error: "Esta orden no tiene un pago de Stripe asociado." }, { status: 400 });
    }
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_id,
    });
    stripeRefundId = refund.id;

    await supabase.from("refunds").insert({
      order_id: order.id,
      stripe_refund_id: refund.id,
      amount: order.total,
      reason: `${reason}: ${description}`,
      status: refund.status === "succeeded" ? "succeeded" : "pending",
      processed_at: new Date().toISOString(),
    });
  }

  const newStatus = processRefund ? "refunded" : "requested_return";
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", order.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: "create_order_refund",
    resourceType: "order",
    resourceId: order.id,
    beforeState: { status: order.status },
    afterState: { status: newStatus, stripeRefundId, reason, description },
  });

  if (processRefund) {
    await sendMail({
      to: order.user_email,
      subject: `Reembolso procesado - Pedido ${order.number}`,
      html: `<p>Hemos procesado el reembolso de tu pedido <strong>${order.number}</strong>. El importe estará disponible en 3-5 días hábiles.</p>`,
    });
  }

  return NextResponse.json({ order: updated });
}
