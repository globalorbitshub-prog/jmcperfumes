import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.productId?.toString();
  const userEmail = body?.userEmail?.toString().trim().toLowerCase();
  const userName = body?.userName?.toString().trim();
  const rating = Number(body?.rating);
  const text = body?.text?.toString().slice(0, 300) || "";

  if (
    !productId ||
    !userEmail ||
    !userName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) ||
    !(rating >= 1 && rating <= 5)
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: product } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    user_email: userEmail,
    user_name: userName,
    rating,
    text,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
