import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { getSupabaseAdmin } from "@/lib/supabase";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jmcperfumes.com";
const DEFAULT_TITLE = "JMC Perfumes | Compra Perfumes Premium Online";
const DEFAULT_DESCRIPTION =
  "Colección de perfumes premium seleccionados. Descubre fragancias únicas para mujer, hombre y unisex.";

export async function generateMetadata(): Promise<Metadata> {
  // Best-effort: SEO settings are a nice-to-have. If the DB is unreachable
  // (or env vars are missing at build time), every page in the app must
  // still render with sane defaults rather than fail.
  const settings: Record<string, unknown> = {};
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["seo_title", "seo_description", "seo_keywords", "seo_image"]);
    for (const row of data || []) settings[row.key] = row.value;
  } catch {
    // fall through to defaults
  }

  const title = (settings.seo_title as string) || DEFAULT_TITLE;
  const description = (settings.seo_description as string) || DEFAULT_DESCRIPTION;
  const keywords = settings.seo_keywords as string | undefined;
  const seoImage = settings.seo_image as string | undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: "%s | JMC Perfumes",
    },
    description,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    openGraph: {
      type: "website",
      siteName: "JMC Perfumes",
      title,
      description,
      images: seoImage ? [seoImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seoImage ? [seoImage] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} font-body bg-cream text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
