import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("products")
    .select("id, name, slug, price, stock, published, featured, image_urls, category_id")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name || body.price == null) {
    return NextResponse.json({ error: "Nombre y precio son obligatorios." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const slug = body.slug?.trim() || slugify(body.name);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      slug,
      description: body.description || null,
      description_long: body.descriptionLong || null,
      price: body.price,
      category_id: body.categoryId || null,
      image_urls: body.imageUrls || [],
      image_alts: body.imageAlts || [],
      notes_top: body.notesTop || null,
      notes_heart: body.notesHeart || null,
      notes_base: body.notesBase || null,
      stock: body.stock ?? 0,
      product_weight: body.productWeight ?? 0.5,
      wallapop_url: body.wallapopUrl || null,
      vinted_url: body.vintedUrl || null,
      featured: !!body.featured,
      published: !!body.published,
      seo_description: body.seoDescription || null,
      seo_keywords: body.seoKeywords || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminId: session.adminId,
    action: "create_product",
    resourceType: "product",
    resourceId: data.id,
    afterState: data,
  });

  return NextResponse.json({ product: data });
}
