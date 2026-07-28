import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Falta el token." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle();

  if (!subscriber) {
    return NextResponse.json({ error: "Enlace inválido o ya utilizado." }, { status: 404 });
  }

  const referenceDate = new Date(subscriber.updated_at || subscriber.subscribed_at);
  if (Date.now() - referenceDate.getTime() > TOKEN_TTL_MS) {
    return NextResponse.json({ error: "El enlace ha caducado. Solicita uno nuevo." }, { status: 410 });
  }

  await supabase
    .from("subscribers")
    .update({ verified: true, verified_at: new Date().toISOString(), verification_token: null })
    .eq("id", subscriber.id);

  return NextResponse.json({ ok: true });
}
