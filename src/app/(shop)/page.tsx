import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ProductCard } from "@/components/shop/ProductCard";
import { NewsletterPopup } from "@/components/shop/NewsletterPopup";
import { withVariantPricing } from "@/lib/products-display";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = getSupabaseAdmin();
  const [{ data: featuredRaw }, { data: categories }, { data: settingsRows }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, price, stock, image_urls, featured")
      .eq("published", true)
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase.from("categories").select("*").order("order").limit(4),
    supabase.from("settings").select("key, value").in("key", ["hero_title", "hero_subtitle", "hero_background_image"]),
  ]);
  const featured = await withVariantPricing(featuredRaw || []);
  const settings: Record<string, unknown> = {};
  for (const row of settingsRows || []) settings[row.key] = row.value;
  const heroTitle = (settings.hero_title as string) || "Descubre tus esencias";
  const heroSubtitle = (settings.hero_subtitle as string) || "Perfumes premium seleccionados";
  const heroBackground = settings.hero_background_image as string | undefined;

  return (
    <div>
      <section
        className="relative bg-gradient-to-br from-secondary/20 via-cream to-accent/10 py-24 px-4 text-center bg-cover bg-center"
        style={heroBackground ? { backgroundImage: `linear-gradient(to bottom right, rgba(139,111,158,0.35), rgba(254,253,249,0.55), rgba(212,165,116,0.25)), url(${heroBackground})` } : undefined}
      >
        <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-4">{heroTitle}</h1>
        <p className="text-primary/70 max-w-xl mx-auto mb-8">{heroSubtitle}</p>
        <Link
          href="/products"
          className="inline-block bg-secondary hover:bg-accent transition text-white rounded px-8 py-3 font-medium"
        >
          Explorar colección
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-heading text-2xl text-primary mb-6">Bestsellers del mes</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(featured || []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {(featured || []).length === 0 && (
            <p className="text-primary/50 col-span-full">Aún no hay productos destacados.</p>
          )}
        </div>
      </section>

      {(categories || []).length > 0 && (
        <section id="categories" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-heading text-2xl text-primary mb-6">Categorías</h2>
          <div className="grid grid-cols-2 gap-4">
            {(categories || []).map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="bg-white border border-border rounded p-6 text-center hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">{c.icon || "🌸"}</div>
                <div className="font-medium text-primary">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="about" className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-heading text-2xl text-primary mb-4">Sobre nosotros</h2>
        <p className="text-primary/70">
          En JMC Perfumes seleccionamos fragancias premium para que encuentres tu esencia perfecta,
          con envíos rápidos y atención cercana.
        </p>
      </section>

      <NewsletterPopup trigger="landing" />
    </div>
  );
}
