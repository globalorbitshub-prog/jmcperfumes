import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const tab = req.nextUrl.searchParams.get("tab") || "pending";
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("reviews")
    .select("*, products(name, slug)")
    .order("created_at", { ascending: false });

  if (tab === "pending") query = query.eq("verified", false).eq("rejected", false);
  if (tab === "approved") query = query.eq("verified", true);
  if (tab === "rejected") query = query.eq("rejected", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}
