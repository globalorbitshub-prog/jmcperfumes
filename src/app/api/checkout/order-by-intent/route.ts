import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const paymentIntent = req.nextUrl.searchParams.get("payment_intent");
  if (!paymentIntent) return NextResponse.json({ error: "Falta payment_intent." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("number, total, user_email, tracking_number")
    .eq("stripe_payment_id", paymentIntent)
    .maybeSingle();

  if (!order) return NextResponse.json({ order: null });
  return NextResponse.json({ order });
}
