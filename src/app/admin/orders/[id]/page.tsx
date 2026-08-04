import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatEUR, formatDate } from "@/lib/utils";
import { OrderActions } from "@/components/admin/OrderActions";
import { DataLoadError } from "@/components/admin/DataLoadError";

export const dynamic = "force-dynamic";

interface OrderProductLine {
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl text-primary">Pedido</h1>
        <DataLoadError message={error.message} />
      </div>
    );
  }
  if (!order) notFound();

  const lines: OrderProductLine[] = order.products_json || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-primary">Pedido {order.number}</h1>
        <span className="text-sm text-primary/60">{formatDate(order.created_at)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded p-4">
            <h2 className="font-medium text-primary mb-3">Cliente</h2>
            <div className="text-sm text-primary/80 space-y-1">
              <p>{order.user_name}</p>
              <p>{order.user_email}</p>
              <p>{order.user_phone}</p>
              <p>
                {order.address}, {order.city} {order.postal_code}, {order.country}
              </p>
            </div>
          </div>

          <div className="bg-white border border-border rounded p-4">
            <h2 className="font-medium text-primary mb-3">Productos</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-primary/60 border-b border-border">
                  <th className="p-2">Producto</th>
                  <th className="p-2">Cant.</th>
                  <th className="p-2">Precio unit.</th>
                  <th className="p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.product_id} className="border-b border-border last:border-0">
                    <td className="p-2">{line.product_name}</td>
                    <td className="p-2">{line.quantity}</td>
                    <td className="p-2">{formatEUR(Number(line.price_at_order))}</td>
                    <td className="p-2">{formatEUR(Number(line.price_at_order) * line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-border rounded p-4">
            <h2 className="font-medium text-primary mb-3">Resumen financiero</h2>
            <div className="text-sm space-y-1">
              <Row label="Subtotal" value={formatEUR(Number(order.subtotal))} />
              {order.coupon_applied && (
                <Row label={`Descuento (${order.coupon_applied})`} value={`-${formatEUR(Number(order.coupon_discount))}`} />
              )}
              <Row label="Impuestos" value={formatEUR(Number(order.tax))} />
              <Row label="Envío" value={formatEUR(Number(order.shipping))} />
              <Row label="Total" value={formatEUR(Number(order.total))} bold />
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded p-4 h-fit">
          <OrderActions
            orderId={order.id}
            status={order.status}
            trackingNumber={order.tracking_number}
            notesAdmin={order.notes_admin}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-heading text-lg text-accent border-t border-border pt-2 mt-2" : "text-primary/80"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
