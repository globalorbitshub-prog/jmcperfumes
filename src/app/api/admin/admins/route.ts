import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { generateTempPassword, hashPassword } from "@/lib/admin/auth";
import { sendMail } from "@/lib/email";

export async function GET() {
  try {
    await requireRole(["super_admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, name, role, status, last_login, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(["super_admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim().toLowerCase();
  const name = body?.name?.toString().trim();
  const role = body?.role || "admin";
  const sendInvite = body?.sendInvite ?? true;

  if (!email || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from("admins").select("id").eq("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "Ya existe un admin con ese email." }, { status: 409 });

  const tempPassword = generateTempPassword(16);
  const { data: admin, error } = await supabase
    .from("admins")
    .insert({
      email,
      name,
      role,
      password_hash: hashPassword(tempPassword),
      status: "pending_validation",
      never_changed_password: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: "create_admin",
    resourceType: "admin",
    resourceId: admin.id,
    afterState: { email, name, role },
  });

  if (sendInvite) {
    await sendMail({
      to: email,
      subject: "Tu cuenta de admin ha sido creada",
      html: `<p>Hola ${name},</p><p>Se ha creado tu cuenta de administrador en JMC Perfumes.</p><p>Email: ${email}<br/>Contraseña temporal: <strong>${tempPassword}</strong></p><p>Inicia sesión en <a href="https://admin.jmcperfumes.es/auth/login">admin.jmcperfumes.es</a> y cambia tu contraseña al entrar.</p>`,
    });
  }

  return NextResponse.json({ admin });
}
