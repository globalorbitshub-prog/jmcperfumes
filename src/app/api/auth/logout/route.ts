import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const supabase = getSupabaseAdmin();
    await supabase.from("admin_sessions").delete().eq("token_hash", hashSessionToken(token));
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
