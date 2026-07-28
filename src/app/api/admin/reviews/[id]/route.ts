import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: before } = await supabase.from("reviews").select("*").eq("id", params.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  const update: Record<string, unknown> = {};
  let action: "approve_review" | "reject_review" | "reply_review" = "reply_review";

  if (body.action === "approve") {
    update.verified = true;
    update.rejected = false;
    action = "approve_review";
  } else if (body.action === "reject") {
    update.verified = false;
    update.rejected = true;
    action = "reject_review";
  }
  if (body.responseAdmin !== undefined) {
    update.response_admin = body.responseAdmin;
    action = "reply_review";
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("reviews")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action,
    resourceType: "review",
    resourceId: params.id,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ review: data });
}
