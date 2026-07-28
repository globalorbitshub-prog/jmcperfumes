import { getSupabaseAdmin } from "@/lib/supabase";
import { formatEUR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-200 text-gray-700",
  paid: "bg-success/20 text-success",
  shipped: "bg-secondary/20 text-secondary",
  delivered: "bg-accent/20 text-accent",
  requested_return: "bg-warning/20 text-warning",
  refunded: "bg-error/20 text-error",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.search)
    query = query.or(`user_email.ilike.%${searchParams.search}%,number.ilike.%${searchParams.search}%`);
  const { data: orders } = await query;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-primary">Órdenes</h1>

      <form className="flex gap-2 flex-wrap">
        <input
          type="text"
          name="search"
          defaultValue={searchParams.search}
          placeholder="Buscar por email o número..."
          className="border border-border rounded px-3 py-2 text-sm w-64"
        />
        <select name="status" defaultValue={searchParams.status || ""} className="border border-border rounded px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="text-sm border border-border rounded px-3 py-2">Filtrar</button>
      </form>

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
            {(orders || []).map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-cream">
                <td className="p-3 font-mono">
                  <a href={`/admin/orders/${o.id}`} className="text-secondary hover:underline">
                    {o.number}
                  </a>
                </td>
                <td className="p-3">{o.user_name || o.user_email}</td>
                <td className="p-3">{formatEUR(Number(o.total))}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </td>
                <td className="p-3 text-primary/60">{formatDate(o.created_at)}</td>
              </tr>
            ))}
            {(orders || []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-primary/50">
                  No hay órdenes que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
