"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/shop/CartProvider";

export function ShopHeader({ categories }: { categories: { name: string; slug: string }[] }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-heading text-2xl text-primary">
          JMC Perfumes
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-primary">
          <Link href="/products" className="hover:text-secondary transition">
            Explorar
          </Link>
          <div className="group relative">
            <button className="hover:text-secondary transition">Categorías</button>
            {categories.length > 0 && (
              <div className="absolute hidden group-hover:block top-full pt-2 min-w-40">
                <div className="bg-white border border-border rounded shadow-lg py-1">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-cream"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/#about" className="hover:text-secondary transition">
            Sobre nosotros
          </Link>
          <Link href="/#contact" className="hover:text-secondary transition">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative text-primary">
            <span aria-hidden>🛍️</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
            <span className="sr-only">Carrito</span>
          </Link>
          <button className="md:hidden text-primary" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border px-4 py-3 space-y-2 text-sm">
          <Link href="/products" className="block" onClick={() => setMenuOpen(false)}>
            Explorar
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/products?category=${c.slug}`} className="block" onClick={() => setMenuOpen(false)}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
