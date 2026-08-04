import { getSupabaseAdmin } from "@/lib/supabase";
import { formatEUR, formatDate } from "@/lib/utils";
import { DataLoadError } from "@/components/admin/DataLoadError";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-200 text-gray-700",
  paid: "bg-success/20 text-success",
  shipped: "bg-secondary/20 text-secondary",
  delivered: "bg-accent/20 text-accent",
  requested_return: "bg-warning/20 text-warning",
  refunded: "bg-error/20 text-error",
};

export default async function DashboardPage() {
  const supabase = getSupabaseAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [ordersToday, recentOrders, reviewsPending, products, subscribersToday] =
    await Promise.all([
      supabase.from("orders").select("total, status").gte("created_at", todayStart.toISOString()),
      supabase
        .from("orders")
        .select("id, number, user_name, user_email, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("verified", false),
      supabase
        .from("products")
        .select("id, name, stock")
        .lt("stock", 5)
        .eq("published", true),
      supabase
        .from("subscribers")
        .select("id", { count: "exact", head: true })
        .gte("subscribed_at", todayStart.toISOString()),
    ]);

  const salesToday = (ordersToday.data || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
  const ordersCountToday = ordersToday.data?.length || 0;
  const pendingReviewsCount = reviewsPending.count || 0;
  const lowStockProducts = products.data || [];
  const loadError = [ordersToday, recentOrders, reviewsPending, products, subscribersToday].find((r) => r.error)?.error;

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl text-primary">Dashboard</h1>
      {loadError && <DataLoadError message={loadError.message} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ventas hoy" value={formatEUR(salesToday)} />
        <KpiCard label="Órdenes hoy" value={String(ordersCountToday)} />
        <KpiCard label="Suscriptores hoy" value={String(subscribersToday.count || 0)} />
        <KpiCard label="Reviews pendientes" value={String(pendingReviewsCount)} />
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-warning/10 border border-warning rounded p-4 text-sm text-primary">
          Stock bajo en {lowStockProducts.length} producto(s):{" "}
          {lowStockProducts.map((p) => p.name).join(", ")}
        </div>
      )}

      <div>
        <h2 className="font-heading text-lg text-primary mb-3">Últimas órdenes</h2>
        <div className="bg-white rounded border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-primary/60 border-b border-border">
                <th className="p-3">Número</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders.data || []).map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono">
                    <a href={`/admin/orders/${o.id}`} className="text-secondary hover:underline">
                      {o.number}
                    </a>
                  </td>
                  <td className="p-3">{o.user_name || o.user_email}</td>
                  <td className="p-3">{formatEUR(Number(o.total))}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-primary/60">{formatDate(o.created_at)}</td>
                </tr>
              ))}
              {(recentOrders.data || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-primary/50">
                    Todavía no hay órdenes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded border border-border p-4">
      <div className="text-xs text-primary/60 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-heading text-primary mt-1">{value}</div>
    </div>
  );
}
