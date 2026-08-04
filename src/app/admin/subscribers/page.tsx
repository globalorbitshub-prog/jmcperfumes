import { getSupabaseAdmin } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { DataLoadError } from "@/components/admin/DataLoadError";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const supabase = getSupabaseAdmin();
  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  const total = subscribers?.length || 0;
  const verified = subscribers?.filter((s) => s.verified).length || 0;
  const unsubscribed = subscribers?.filter((s) => s.unsubscribed).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-primary">Newsletter</h1>
        <a href="/api/admin/subscribers/export" className="text-sm border border-border rounded px-4 py-2">
          Exportar CSV
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Total suscriptores" value={String(total)} />
        <Kpi label="Verificados" value={String(verified)} />
        <Kpi label="% conversión" value={total ? `${Math.round((verified / total) * 100)}%` : "0%"} />
      </div>

      {error && <DataLoadError message={error.message} />}

      <div className="bg-white rounded border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary/60 border-b border-border">
              <th className="p-3">Email</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Fuente</th>
              <th className="p-3">Verificado</th>
              <th className="p-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(subscribers || []).map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="p-3">{s.email}</td>
                <td className="p-3">{s.name || "-"}</td>
                <td className="p-3">{s.source}</td>
                <td className="p-3">
                  {s.unsubscribed ? (
                    <span className="text-primary/40">Desuscrito</span>
                  ) : s.verified ? (
                    <span className="text-success">Sí</span>
                  ) : (
                    <span className="text-warning">Pendiente</span>
                  )}
                </td>
                <td className="p-3 text-primary/60">{formatDate(s.subscribed_at)}</td>
              </tr>
            ))}
            {!error && (subscribers || []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-primary/50">
                  Todavía no hay suscriptores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-primary/50">{unsubscribed} desuscritos en total.</p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded border border-border p-4">
      <div className="text-xs text-primary/60 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-heading text-primary mt-1">{value}</div>
    </div>
  );
}
