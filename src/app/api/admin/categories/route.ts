import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { slugify } from "@/lib/utils";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("categories").select("*").order("order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "Nombre obligatorio." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: body.name,
      slug: body.slug?.trim() || slugify(body.name),
      icon: body.icon || null,
      color: body.color || null,
      description: body.description || null,
      order: body.order ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
