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
            <button className="hover:text-secondary transition focus:outline-none focus-visible:text-secondary">
              Categorías
            </button>
            {categories.length > 0 && (
              <div className="absolute hidden group-hover:block group-focus-within:block hover:block top-full pt-2 min-w-40">
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
          <Link href="/cart" className="relative text-primary p-2 -m-2 flex items-center justify-center">
            <span aria-hidden>🛍️</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
            <span className="sr-only">Carrito</span>
          </Link>
          <button
            className="md:hidden w-10 h-10 -mr-2 flex items-center justify-center text-primary text-xl"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menú"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 top-[57px] bg-black/20 z-10 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="md:hidden relative z-20 bg-cream border-t border-border px-4 py-3 space-y-1 text-sm">
            <Link href="/products" className="block py-2.5" onClick={() => setMenuOpen(false)}>
              Explorar
            </Link>
            <Link href="/#about" className="block py-2.5" onClick={() => setMenuOpen(false)}>
              Sobre nosotros
            </Link>
            <Link href="/#contact" className="block py-2.5" onClick={() => setMenuOpen(false)}>
              Contacto
            </Link>
            {categories.length > 0 && (
              <div className="pt-2 mt-2 border-t border-border">
                <div className="text-xs uppercase tracking-wide text-primary/40 mb-1">Categorías</div>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/products?category=${c.slug}`}
                    className="block py-2.5"
                    onClick={() => setMenuOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
