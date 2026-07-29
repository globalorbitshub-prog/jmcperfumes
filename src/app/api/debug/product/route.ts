import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "le-beau-paradise-garden";
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  return NextResponse.json({ error: error?.message || null, data });
}
