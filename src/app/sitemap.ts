import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jmcperfumes.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at, featured")
    .eq("published", true);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/legal/privacy`, priority: 0.3 },
    { url: `${SITE_URL}/legal/terms`, priority: 0.3 },
    { url: `${SITE_URL}/legal/returns`, priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: p.featured ? 0.8 : 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
