import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatEUR } from "@/lib/utils";
import { AddToCartControls } from "@/components/shop/AddToCartControls";
import { ReviewForm } from "@/components/shop/ReviewForm";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return product;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: `${product.name} - Compra online en JMC Perfumes`,
    description: product.seo_description || product.description?.slice(0, 160),
    openGraph: {
      type: "website",
      images: product.image_urls?.[0] ? [product.image_urls[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const supabase = getSupabaseAdmin();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .eq("verified", true)
    .order("created_at", { ascending: false });

  const reviewCount = reviews?.length || 0;
  const avgRating = reviewCount
    ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image_urls?.[0],
    brand: { "@type": "Brand", name: "JMC Perfumes" },
    offers: {
      "@type": "Offer",
      url: `https://jmcperfumes.es/products/${product.slug}`,
      priceCurrency: "EUR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs text-primary/50 mb-6">
        <a href="/">Home</a> {" > "}
        {product.categories && (
          <>
            <a href={`/products?category=${product.categories.slug}`}>{product.categories.name}</a> {" > "}
          </>
        )}
        {product.name}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square bg-border/30 rounded overflow-hidden">
            {product.image_urls?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_urls[0]} alt={product.image_alts?.[0] || product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary/30">Sin imagen</div>
            )}
          </div>
          {product.image_urls?.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {product.image_urls.slice(1).map((url: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={product.image_alts?.[i + 1] || product.name} className="aspect-square object-cover rounded" />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.categories && (
            <span className="text-xs bg-secondary/10 text-secondary rounded px-2 py-1">{product.categories.name}</span>
          )}
          <h1 className="font-heading text-3xl text-primary mt-2">{product.name}</h1>
          {avgRating && (
            <div className="text-accent text-sm mt-1">
              {"★".repeat(Math.round(Number(avgRating)))}
              {"☆".repeat(5 - Math.round(Number(avgRating)))} {avgRating} ({reviewCount} reseñas)
            </div>
          )}
          <div className="font-heading text-3xl text-accent mt-3">{formatEUR(Number(product.price))}</div>
          <p className={`text-sm mt-1 ${product.stock > 0 ? "text-success" : "text-primary/50"}`}>
            {product.stock > 0 ? "✓ Disponible" : "Agotado"}
          </p>
          {product.stock > 0 && product.stock < 5 && (
            <p className="text-warning text-sm">Quedan {product.stock} unidades</p>
          )}

          <p className="text-primary/80 mt-4">{product.description}</p>
          {product.description_long && (
            <p className="text-primary/70 mt-2 text-sm">{product.description_long}</p>
          )}

          {(product.notes_top || product.notes_heart || product.notes_base) && (
            <div className="mt-6 space-y-1 text-sm">
              {product.notes_top && (
                <p>
                  <strong>Salida:</strong> {product.notes_top}
                </p>
              )}
              {product.notes_heart && (
                <p>
                  <strong>Corazón:</strong> {product.notes_heart}
                </p>
              )}
              {product.notes_base && (
                <p>
                  <strong>Fondo:</strong> {product.notes_base}
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <AddToCartControls
              productId={product.id}
              name={product.name}
              slug={product.slug}
              price={Number(product.price)}
              image={product.image_urls?.[0] || null}
              stock={product.stock}
            />
          </div>

          <div className="mt-6 text-sm text-primary/70 space-y-1">
            <p>✓ Envío gratis en pedidos superiores a 50€</p>
            <p>✓ 30 días de devolución</p>
            <p>✓ Pago 100% seguro</p>
          </div>

          {(product.wallapop_url || product.vinted_url) && (
            <div className="mt-4 flex gap-3 text-sm">
              {product.wallapop_url && (
                <a href={product.wallapop_url} target="_blank" rel="noreferrer" className="underline text-secondary">
                  Disponible en Wallapop
                </a>
              )}
              {product.vinted_url && (
                <a href={product.vinted_url} target="_blank" rel="noreferrer" className="underline text-secondary">
                  Disponible en Vinted
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-heading text-2xl text-primary mb-4">Reseñas</h2>
        <div className="space-y-4 mb-8">
          {(reviews || []).map((r) => (
            <div key={r.id} className="border-b border-border pb-4">
              <div className="text-accent text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p className="text-sm text-primary/60">{r.user_name}</p>
              <p className="text-primary/80 mt-1">{r.text}</p>
              {r.response_admin && (
                <p className="text-sm text-secondary bg-secondary/5 rounded p-2 mt-2">
                  Respuesta de JMC Perfumes: {r.response_admin}
                </p>
              )}
            </div>
          ))}
          {(reviews || []).length === 0 && <p className="text-primary/50 text-sm">Todavía no hay reseñas.</p>}
        </div>
        <ReviewForm productId={product.id} />
      </section>
    </div>
  );
}
