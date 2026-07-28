import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/admin/session";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("tax_rates").select("*").order("country");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rates: data });
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["super_admin", "admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.country) return NextResponse.json({ error: "País obligatorio." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("tax_rates").upsert(
    {
      country: body.country,
      tax_percent: body.taxPercent ?? 21,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "country" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
