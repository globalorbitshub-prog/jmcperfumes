import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://jmcperfumes.es"),
  title: {
    default: "JMC Perfumes | Compra Perfumes Premium Online",
    template: "%s | JMC Perfumes",
  },
  description:
    "Colección de perfumes premium seleccionados. Descubre fragancias únicas para mujer, hombre y unisex.",
  openGraph: {
    type: "website",
    siteName: "JMC Perfumes",
  },
};

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
