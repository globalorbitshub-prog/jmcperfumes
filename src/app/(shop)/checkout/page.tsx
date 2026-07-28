import { CheckoutForm } from "@/components/shop/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-heading text-2xl text-primary mb-6">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
