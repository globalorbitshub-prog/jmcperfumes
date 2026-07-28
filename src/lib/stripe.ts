import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var.");
  stripeClient = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return stripeClient;
}
