"use client";

import Link from "next/link";
import { useCart } from "@/components/shop/CartProvider";
import { formatEUR } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🛍️</p>
        <h1 className="font-heading text-2xl text-primary mb-2">Tu carrito está vacío</h1>
        <Link href="/products" className="inline-block mt-4 bg-secondary hover:bg-accent transition text-white rounded px-6 py-2 text-sm">
          Volver a comprar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-3">
        <h1 className="font-heading text-2xl text-primary mb-4">Tu carrito</h1>
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId ?? ""}`}
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white border border-border rounded p-3"
          >
            <div className="flex items-start gap-3 sm:contents">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-border/30 rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${item.slug}`} className="font-medium text-primary hover:text-secondary">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="sm:hidden w-9 h-9 -mt-1.5 -mr-1.5 flex items-center justify-center text-error text-lg shrink-0"
                    aria-label="Eliminar del carrito"
                  >
                    ×
                  </button>
                </div>
                {item.sizeMl != null && <div className="text-xs text-primary/50">{item.sizeMl} ml</div>}
                <div className="text-sm text-primary/60">{formatEUR(item.price)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end sm:gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              <div className="w-20 text-right font-medium">{formatEUR(item.price * item.quantity)}</div>
              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="hidden sm:flex w-9 h-9 items-center justify-center text-error text-lg shrink-0"
                aria-label="Eliminar del carrito"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded p-4 h-fit sticky top-20">
        <h2 className="font-medium text-primary mb-3">Resumen</h2>
        <div className="flex justify-between text-sm mb-2">
          <span>Subtotal</span>
          <span>{formatEUR(subtotal)}</span>
        </div>
        <p className="text-xs text-primary/50 mb-4">Impuestos y envío se calculan en el checkout.</p>
        <div className="flex justify-between font-heading text-xl text-accent border-t border-border pt-3 mb-4">
          <span>Total</span>
          <span>{formatEUR(subtotal)}</span>
        </div>
        <Link href="/checkout" className="block text-center bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm mb-2">
          Proceder a checkout
        </Link>
        <Link href="/products" className="block text-center text-sm text-primary/60 underline">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
