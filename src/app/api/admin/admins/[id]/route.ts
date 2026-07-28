import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/admin/session";
import { writeAuditLog, AuditAction } from "@/lib/admin/audit";
import { sendMail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole(["super_admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string;
  if (!action) return NextResponse.json({ error: "Falta la acción." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: before } = await supabase.from("admins").select("*").eq("id", params.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Admin no encontrado." }, { status: 404 });

  const update: Record<string, unknown> = {};
  let auditAction: AuditAction = "edit_admin";
  let emailSubject: string | null = null;
  let emailHtml: string | null = null;

  switch (action) {
    case "approve":
      update.status = "active";
      auditAction = "edit_admin";
      emailSubject = "Tu cuenta de admin ha sido aprobada";
      emailHtml = "<p>Ya puedes iniciar sesión en el panel de administración.</p>";
      break;
    case "reject":
      update.deleted_at = new Date().toISOString();
      auditAction = "delete_admin";
      break;
    case "change_role":
      if (!["super_admin", "admin", "moderator"].includes(body.role)) {
        return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
      }
      update.role = body.role;
      break;
    case "suspend":
      update.status = "suspended";
      auditAction = "suspend_admin";
      break;
    case "reactivate":
      update.status = "active";
      auditAction = "reactivate_admin";
      break;
    case "reset_2fa":
      update.totp_secret = null;
      update.totp_backup_codes = null;
      auditAction = "reset_admin_2fa";
      emailSubject = "Tu 2FA ha sido reestablecida";
      emailHtml = "<p>Se ha reestablecido tu autenticación en dos pasos. Deberás configurarla de nuevo en tu próximo inicio de sesión.</p>";
      break;
    case "delete":
      update.deleted_at = new Date().toISOString();
      auditAction = "delete_admin";
      break;
    default:
      return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("admins")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: auditAction,
    resourceType: "admin",
    resourceId: params.id,
    beforeState: before,
    afterState: data,
  });

  if (emailSubject && emailHtml) {
    await sendMail({ to: before.email, subject: emailSubject, html: emailHtml });
  }

  return NextResponse.json({ admin: data });
}
