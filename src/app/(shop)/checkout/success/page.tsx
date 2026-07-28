"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/components/shop/CartProvider";
import { NewsletterPopup } from "@/components/shop/NewsletterPopup";
import { formatEUR } from "@/lib/utils";

interface OrderSummary {
  number: string;
  total: number;
  user_email: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const paymentIntent = params.get("payment_intent");
  const { clear } = useCart();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paymentIntent || order || attempts > 8) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/checkout/order-by-intent?payment_intent=${paymentIntent}`);
      const data = await res.json();
      if (data.order) setOrder(data.order);
      else setAttempts((a) => a + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [paymentIntent, order, attempts]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/15 flex items-center justify-center"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-success"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
        >
          <motion.path
            d="M4 12l5 5L20 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </motion.svg>
      </motion.div>
      <h1 className="font-heading text-2xl text-primary mb-2">¡Compra confirmada!</h1>
      {order ? (
        <>
          <p className="text-primary/70">
            Número de pedido: <strong>{order.number}</strong>
          </p>
          <p className="text-primary/70">Total: {formatEUR(Number(order.total))}</p>
          <p className="text-sm text-primary/50 mt-2">Hemos enviado un email de confirmación a {order.user_email}.</p>
        </>
      ) : (
        <p className="text-primary/50 text-sm">Confirmando tu pedido...</p>
      )}
      <Link href="/" className="inline-block mt-8 bg-secondary hover:bg-accent transition text-white rounded px-6 py-2 text-sm">
        Volver al inicio
      </Link>
      <NewsletterPopup trigger="checkout-success" orderEmail={order?.user_email} />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
