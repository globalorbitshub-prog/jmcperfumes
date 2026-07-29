import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("size_ml, price, stock")
    .eq("product_id", params.id)
    .order("order");

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-primary">Editar producto</h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.category_id || "",
          price: Number(product.price),
          stock: product.stock,
          description: product.description || "",
          descriptionLong: product.description_long || "",
          notesTop: product.notes_top || "",
          notesHeart: product.notes_heart || "",
          notesBase: product.notes_base || "",
          wallapopUrl: product.wallapop_url || "",
          vintedUrl: product.vinted_url || "",
          seoDescription: product.seo_description || "",
          seoKeywords: product.seo_keywords || "",
          published: product.published,
          featured: product.featured,
          imageUrls: product.image_urls || [],
          imageAlts: product.image_alts || [],
          variants: (variants || []).map((v) => ({
            sizeMl: Number(v.size_ml),
            price: Number(v.price),
            stock: v.stock,
          })),
        }}
      />
    </div>
  );
}
