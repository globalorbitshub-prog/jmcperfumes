import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession, requireRole } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const settings: Record<string, unknown> = {};
  for (const row of data || []) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  let session;
  try {
    session = await requireRole(["super_admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const entries = Object.entries(body as Record<string, unknown>);
  for (const [key, value] of entries) {
    await supabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
  }

  await writeAuditLog({
    adminId: session.adminId,
    action: "update_settings",
    resourceType: "settings",
    afterState: body,
  });

  return NextResponse.json({ ok: true });
}
