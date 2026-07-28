"use client";

import { useEffect, useState } from "react";

type Trigger = "landing" | "exit-intent" | "checkout-success";

const STORAGE_KEYS: Record<Trigger, string> = {
  landing: "newsletter_popup_shown",
  "exit-intent": "newsletter_popup_exit_shown",
  "checkout-success": "newsletter_popup_checkout_shown",
};

export function NewsletterPopup({ trigger, orderEmail }: { trigger: Trigger; orderEmail?: string }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState(orderEmail || "");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = STORAGE_KEYS[trigger];
    if (localStorage.getItem(key)) return;

    if (trigger === "checkout-success") {
      setVisible(true);
      localStorage.setItem(key, "1");
      return;
    }

    if (trigger === "landing") {
      const timer = setTimeout(() => {
        setVisible(true);
        localStorage.setItem(key, "1");
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (trigger === "exit-intent") {
      const onMouseLeave = (e: MouseEvent) => {
        if (e.clientY < 50) {
          setVisible(true);
          localStorage.setItem(key, "1");
          document.removeEventListener("mouseleave", onMouseLeave);
        }
      };
      document.addEventListener("mouseleave", onMouseLeave);
      return () => document.removeEventListener("mouseleave", onMouseLeave);
    }
  }, [trigger]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Debes aceptar la política de privacidad.");
      return;
    }
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: trigger === "checkout-success" ? "checkout" : trigger, gdprConsent: consent }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al suscribirte.");
      return;
    }
    setDone(true);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-cream rounded-lg shadow-xl max-w-sm w-full p-6 relative">
        <button onClick={() => setVisible(false)} className="absolute top-3 right-3 text-primary/50" aria-label="Cerrar">
          ×
        </button>
        {done ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🌸</p>
            <p className="font-heading text-lg text-primary">¡Revisa tu email!</p>
            <p className="text-sm text-primary/70 mt-1">Te hemos enviado un enlace para confirmar tu suscripción.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-2xl text-center">
              {trigger === "checkout-success" ? "🎉" : "🌸"}
            </p>
            <h3 className="font-heading text-lg text-primary text-center">
              {trigger === "checkout-success"
                ? "¡Tu compra está confirmada!"
                : trigger === "exit-intent"
                ? "¡No te vayas!"
                : "Nuevos perfumes cada semana"}
            </h3>
            <p className="text-sm text-primary/70 text-center">
              {trigger === "checkout-success"
                ? "Ahora sé el primero en enterarte de nuevos lanzamientos y ofertas."
                : "Suscríbete y entérate antes que nadie."}
            </p>
            {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {trigger === "checkout-success" && (
              <p className="text-xs text-primary/50">Usaremos el email de tu compra.</p>
            )}
            <label className="flex items-start gap-2 text-xs text-primary/70">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              Acepto recibir comunicaciones comerciales y he leído la{" "}
              <a href="/legal/privacy" className="underline">
                política de privacidad
              </a>
              .
            </label>
            <button type="submit" className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 text-sm">
              Sí, notifícame
            </button>
            <button type="button" onClick={() => setVisible(false)} className="w-full text-xs text-primary/50">
              Quizás después
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
