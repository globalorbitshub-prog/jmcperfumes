"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";

export function AddToCartControls({
  productId,
  name,
  slug,
  price,
  image,
  stock,
}: {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  function add() {
    addItem({ productId, name, slug, price, image, stock }, quantity);
  }

  function buyNow() {
    add();
    router.push("/cart");
  }

  if (stock === 0) {
    return <p className="text-primary/50 text-sm">Este producto está agotado por el momento.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-8 h-8 border border-border rounded"
        >
          −
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
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
    </div>
  );
}
