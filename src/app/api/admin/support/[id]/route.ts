import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { sendMail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const supabase = getSupabaseAdmin();
  const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", params.id).maybeSingle();
  if (!ticket) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) update.status = body.status;

  if (body.reply) {
    const messages = Array.isArray(ticket.messages_json) ? ticket.messages_json : [];
    messages.push({ from: "admin", text: body.reply, at: new Date().toISOString() });
    update.messages_json = messages;
    await sendMail({
      to: ticket.email,
      subject: `Respuesta a tu consulta: ${ticket.subject}`,
      html: `<p>${body.reply}</p>`,
    });
  }

  const { data, error } = await supabase.from("support_tickets").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
