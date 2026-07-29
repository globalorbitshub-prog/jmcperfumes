"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";
import { formatEUR } from "@/lib/utils";

export interface ProductVariant {
  id: string;
  sizeMl: number;
  price: number;
  stock: number;
}

export function AddToCartControls({
  productId,
  name,
  slug,
  price,
  image,
  stock,
  variants,
}: {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
  variants?: ProductVariant[];
}) {
  const hasVariants = !!variants && variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? variants!.find((v) => v.stock > 0) || variants![0] : null
  );

  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const effectivePrice = hasVariants ? selectedVariant?.price ?? 0 : price;
  const effectiveStock = hasVariants ? selectedVariant?.stock ?? 0 : stock;

  function add() {
    addItem(
      {
        productId,
        variantId: hasVariants ? selectedVariant?.id ?? null : null,
        sizeMl: hasVariants ? selectedVariant?.sizeMl ?? null : null,
        name,
        slug,
        price: effectivePrice,
        image,
        stock: effectiveStock,
      },
      quantity
    );
  }

  function buyNow() {
    add();
    router.push("/cart");
  }

  return (
    <div className="space-y-3">
      <div className="font-heading text-3xl text-accent">{formatEUR(effectivePrice)}</div>
      <p className={`text-sm ${effectiveStock > 0 ? "text-success" : "text-primary/50"}`}>
        {effectiveStock > 0 ? "✓ Disponible" : "Agotado"}
      </p>
      {effectiveStock > 0 && effectiveStock < 5 && (
        <p className="text-warning text-sm">Quedan {effectiveStock} unidades</p>
      )}

      {hasVariants && (
        <div>
          <div className="text-sm text-primary mb-2">Elige el tamaño</div>
          <div className="flex flex-wrap gap-2">
            {variants!.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock === 0}
                onClick={() => {
                  setSelectedVariant(v);
                  setQuantity(1);
                }}
                className={`px-3 py-2 rounded border text-sm transition ${
                  selectedVariant?.id === v.id
                    ? "border-secondary bg-secondary/10 text-secondary font-medium"
                    : "border-border text-primary/80"
                } ${v.stock === 0 ? "opacity-40 cursor-not-allowed" : "hover:border-secondary"}`}
              >
                {v.sizeMl} ml — {formatEUR(v.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      {effectiveStock === 0 ? (
        <p className="text-primary/50 text-sm">Este {hasVariants ? "tamaño" : "producto"} está agotado por el momento.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 border border-border rounded"
            >
              −
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
              className="w-8 h-8 border border-border rounded"
            >
              +
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={add} className="flex-1 border border-secondary text-secondary rounded py-2 text-sm font-medium">
              Agregar al carrito
            </button>
            <button onClick={buyNow} className="flex-1 bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm font-medium">
              Comprar ahora
            </button>
          </div>
        </>
      )}
    </div>
  );
}
