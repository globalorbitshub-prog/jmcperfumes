import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  let queryError: string | null = null;
  let adminCount: number | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error, count } = await supabase
      .from("admins")
      .select("id", { count: "exact" });
    queryError = error ? error.message : null;
    adminCount = count ?? (data ? data.length : null);
  } catch (e) {
    queryError = (e as Error).message;
  }

  return NextResponse.json({
    hasUrl: !!url,
    urlPreview: url ? `${url.slice(0, 20)}...${url.slice(-10)}` : null,
    hasKey: !!key,
    keyLength: key.length,
    queryError,
    adminCount,
  });
}
