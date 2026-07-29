"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useCart } from "@/components/shop/CartProvider";
import { formatEUR } from "@/lib/utils";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const COUNTRIES = [
  { code: "ES", name: "España" },
  { code: "FR", name: "Francia" },
  { code: "PT", name: "Portugal" },
  { code: "DE", name: "Alemania" },
  { code: "IT", name: "Italia" },
];

interface Quote {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export function CheckoutForm() {
  const { items, subtotal } = useCart();
  const [customer, setCustomer] = useState({
    email: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "ES",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof customer>(key: K, value: string) {
    setCustomer((c) => ({ ...c, [key]: value }));
  }

  async function proceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          customer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al preparar el pago.");
        return;
      }
      setClientSecret(data.clientSecret);
      setQuote(data.quote);
    } finally {
      setLoading(false);
    }
  }

  if (clientSecret && quote && stripePromise) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentStep quote={quote} />
      </Elements>
    );
  }

  return (
    <form onSubmit={proceedToPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-3 bg-white border border-border rounded p-4">
        <h2 className="font-medium text-primary mb-2">Datos del cliente</h2>
        {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
        <input required type="email" placeholder="Email" value={customer.email} onChange={(e) => update("email", e.target.value)} className="input" />
        <input required placeholder="Nombre completo" value={customer.name} onChange={(e) => update("name", e.target.value)} className="input" />
        <input required placeholder="Teléfono" value={customer.phone} onChange={(e) => update("phone", e.target.value)} className="input" />
        <input required placeholder="Dirección" value={customer.address} onChange={(e) => update("address", e.target.value)} className="input" />
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Ciudad" value={customer.city} onChange={(e) => update("city", e.target.value)} className="input" />
          <input required placeholder="Código postal" value={customer.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="input" />
        </div>
        <select value={customer.country} onChange={(e) => update("country", e.target.value)} className="input">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-border rounded p-4 h-fit">
        <h2 className="font-medium text-primary mb-3">Resumen</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatEUR(subtotal)}</span>
        </div>
        <p className="text-xs text-primary/50 my-2">Impuestos y envío se calculan al continuar.</p>
        <button disabled={loading || items.length === 0} className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm mt-2 disabled:opacity-50">
          {loading ? "Calculando..." : "Continuar al pago"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e8e3dc;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
  );
}

function PaymentStep({ quote }: { quote: Quote }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });
    if (stripeError) {
      setError(stripeError.message || "Error al procesar el pago.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={pay} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white border border-border rounded p-4">
        <h2 className="font-medium text-primary mb-3">Pago</h2>
        {error && <p className="text-error text-sm bg-error/10 rounded p-2 mb-2">{error}</p>}
        <PaymentElement />
      </div>
      <div className="bg-white border border-border rounded p-4 h-fit">
        <h2 className="font-medium text-primary mb-3">Total a pagar</h2>
        <Row label="Subtotal" value={formatEUR(quote.subtotal)} />
        <Row label="Impuestos" value={formatEUR(quote.tax)} />
        <Row label="Envío" value={formatEUR(quote.shipping)} />
        <div className="flex justify-between font-heading text-xl text-accent border-t border-border pt-2 mt-2">
          <span>Total</span>
          <span>{formatEUR(quote.total)}</span>
        </div>
        <button disabled={processing || !stripe} className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm mt-4 disabled:opacity-50">
          {processing ? "Redirigiendo a pago seguro..." : `Pagar ${formatEUR(quote.total)}`}
        </button>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-primary/80">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
