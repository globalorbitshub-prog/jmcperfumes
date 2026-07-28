import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("subscribers")
    .select("email, name, source, verified, subscribed_at, unsubscribed")
    .order("subscribed_at", { ascending: false });

  const header = "email,name,source,verified,subscribed_at,unsubscribed\n";
  const rows = (data || [])
    .map((s) =>
      [s.email, s.name || "", s.source, s.verified, s.subscribed_at, s.unsubscribed]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="subscribers.csv"`,
    },
  });
}
