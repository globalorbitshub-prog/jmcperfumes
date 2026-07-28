import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-primary">Nuevo producto</h1>
      <ProductForm />
    </div>
  );
}
