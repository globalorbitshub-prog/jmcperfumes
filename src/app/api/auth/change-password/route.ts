import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { hashPassword, verifyPassword, PASSWORD_POLICY, PASSWORD_POLICY_MESSAGE } from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = body?.currentPassword?.toString();
  const newPassword = body?.newPassword?.toString();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }
  if (!PASSWORD_POLICY.test(newPassword)) {
    return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: admin } = await supabase
    .from("admins")
    .select("id, password_hash")
    .eq("id", session.adminId)
    .maybeSingle();
  if (!admin || !verifyPassword(currentPassword, admin.password_hash)) {
    return NextResponse.json({ error: "Contraseña actual incorrecta." }, { status: 401 });
  }

  await supabase
    .from("admins")
    .update({ password_hash: hashPassword(newPassword), never_changed_password: false })
    .eq("id", admin.id);

  return NextResponse.json({ ok: true });
}
