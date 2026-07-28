import { getSupabaseAdmin } from "@/lib/supabase";
import { CartProvider } from "@/components/shop/CartProvider";
import { ShopHeader } from "@/components/shop/Header";
import { ShopFooter } from "@/components/shop/Footer";

export const dynamic = "force-dynamic";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JMC Perfumes",
  url: "https://jmcperfumes.es",
  logo: "https://jmcperfumes.es/logo.svg",
  description: "Perfumes premium online",
};

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseAdmin();
  const { data: categories } = await supabase.from("categories").select("name, slug").order("order");

  return (
    <CartProvider>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <ShopHeader categories={categories || []} />
      <main>{children}</main>
      <ShopFooter />
    </CartProvider>
  );
}
