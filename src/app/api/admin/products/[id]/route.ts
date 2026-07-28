import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: before } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const allowed = [
    "name", "slug", "description", "description_long", "price", "category_id",
    "image_urls", "image_alts", "notes_top", "notes_heart", "notes_base", "stock",
    "product_weight", "wallapop_url", "vinted_url", "featured", "published",
    "seo_description", "seo_keywords",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (body[camel] !== undefined) update[key] = body[camel];
    else if (body[key] !== undefined) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: "edit_product",
    resourceType: "product",
    resourceId: params.id,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ product: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: before } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), published: false })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: "delete_product",
    resourceType: "product",
    resourceId: params.id,
    beforeState: before,
  });

  return NextResponse.json({ ok: true });
}
