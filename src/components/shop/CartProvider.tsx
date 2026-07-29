"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  variantId: string | null;
  sizeMl: number | null;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "jmc_cart";

function sameLine(a: { productId: string; variantId: string | null }, b: { productId: string; variantId?: string | null }) {
  return a.productId === b.productId && a.variantId === (b.variantId ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartItem>[];
        setItems(parsed.map((i) => ({ variantId: null, sizeMl: null, ...i } as CartItem)));
      }
    } catch {
      // ignore corrupt cart state
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, item) ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock || 99) } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null = null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, variantId })));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId: string | null = null) => {
      setItems((prev) =>
        prev.map((i) => (sameLine(i, { productId, variantId }) ? { ...i, quantity: Math.max(1, quantity) } : i))
      );
    },
    []
  );

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
