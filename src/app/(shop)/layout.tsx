import { getSupabaseAdmin } from "@/lib/supabase";
import { CartProvider } from "@/components/shop/CartProvider";
import { ShopHeader } from "@/components/shop/Header";
import { ShopFooter } from "@/components/shop/Footer";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jmcperfumes.com";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseAdmin();
  const [{ data: categories }, { data: settingsRows }] = await Promise.all([
    supabase.from("categories").select("name, slug").order("order"),
    supabase.from("settings").select("key, value").eq("key", "logo_url"),
  ]);
  const logoUrl = (settingsRows?.find((r) => r.key === "logo_url")?.value as string) || null;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JMC Perfumes",
    url: SITE_URL,
    logo: logoUrl || `${SITE_URL}/logo.svg`,
    description: "Perfumes premium online",
  };

  return (
    <CartProvider>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <ShopHeader categories={categories || []} logoUrl={logoUrl} />
      <main>{children}</main>
      <ShopFooter />
      <WhatsAppButton />
    </CartProvider>
  );
}
