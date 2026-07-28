import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin/session";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = "product-images";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Formato no soportado (usa JPG, PNG o WebP)." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo supera los 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const filename = `${crypto.randomUUID()}.webp`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, optimized, { contentType: "image/webp" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: publicUrlData.publicUrl });
}
