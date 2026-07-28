import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/newsletter";

const RETENTION_DAYS = 730;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim().toLowerCase();
  const token = body?.token?.toString();

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Enlace inválido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const retentionUntil = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("subscribers")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
      retention_until: retentionUntil,
    })
    .eq("email", email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
