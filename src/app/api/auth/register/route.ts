import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, PASSWORD_POLICY, PASSWORD_POLICY_MESSAGE } from "@/lib/admin/auth";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString();
  const name = body?.name?.toString().trim();

  if (!email || !password || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
  }
  if (!PASSWORD_POLICY.test(password)) {
    return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });
  }

  await supabase.from("admins").insert({
    email,
    name,
    password_hash: hashPassword(password),
    role: "admin",
    status: "pending_validation",
  });

  const { data: superAdmins } = await supabase
    .from("admins")
    .select("email")
    .eq("role", "super_admin")
    .eq("status", "active");

  await sendMail({
    to: email,
    subject: "Tu solicitud de admin está en revisión",
    html: `<p>Hola ${name},</p><p>Tu solicitud de acceso como administrador de JMC Perfumes ha sido recibida y está pendiente de aprobación.</p>`,
  });
  for (const sa of superAdmins || []) {
    await sendMail({
      to: sa.email,
      subject: `Nuevo admin pendiente: ${email}`,
      html: `<p>Un nuevo administrador se ha registrado y espera validación: <strong>${email}</strong>.</p><p>Revísalo en /admin/settings/admins</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
