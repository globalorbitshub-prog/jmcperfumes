import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { sendMail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  return NextResponse.json({ order: data });
}

const STATUS_EMAIL_SUBJECT: Record<string, string> = {
  paid: "Hemos recibido tu pago",
  shipped: "Tu pedido ha sido enviado",
  delivered: "Tu pedido ha sido entregado",
  requested_return: "Hemos recibido tu solicitud de devolución",
  refunded: "Tu reembolso ha sido procesado",
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: before } = await supabase.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (body.status) {
    update.status = body.status;
    if (body.status === "shipped") update.shipped_at = new Date().toISOString();
    if (body.status === "delivered") update.delivered_at = new Date().toISOString();
  }
  if (body.trackingNumber !== undefined) update.tracking_number = body.trackingNumber;
  if (body.notesAdmin !== undefined) update.notes_admin = body.notesAdmin;

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: "update_order_status",
    resourceType: "order",
    resourceId: params.id,
    beforeState: before,
    afterState: data,
  });

  if (body.status && body.status !== before.status && STATUS_EMAIL_SUBJECT[body.status]) {
    await sendMail({
      to: data.user_email,
      subject: `${STATUS_EMAIL_SUBJECT[body.status]} - Pedido ${data.number}`,
      html: `<p>Hola ${data.user_name || ""},</p><p>El estado de tu pedido <strong>${data.number}</strong> ha cambiado a: <strong>${body.status}</strong>.</p>${
        data.tracking_number ? `<p>Número de seguimiento: ${data.tracking_number}</p>` : ""
      }`,
    });
  }

  return NextResponse.json({ order: data });
}
