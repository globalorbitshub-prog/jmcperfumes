import { getSupabaseAdmin } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { DataLoadError } from "@/components/admin/DataLoadError";

export const dynamic = "force-dynamic";

interface AuditLogRow {
  id: string;
  timestamp: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  admins: { email: string } | null;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { resource?: string; action?: string };
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("audit_logs")
    .select("*, admins(email)")
    .order("timestamp", { ascending: false })
    .limit(100);
  if (searchParams.resource) query = query.eq("resource_type", searchParams.resource);
  if (searchParams.action) query = query.eq("action", searchParams.action);
  const { data: logs, error } = await query;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-primary">Auditoría</h1>
      {error && <DataLoadError message={error.message} />}

      <form className="flex gap-2">
        <select name="resource" defaultValue={searchParams.resource || ""} className="border border-border rounded px-3 py-2 text-sm">
          <option value="">Todos los recursos</option>
          <option value="product">Producto</option>
          <option value="order">Orden</option>
          <option value="review">Reseña</option>
          <option value="coupon">Cupón</option>
          <option value="admin">Admin</option>
          <option value="settings">Configuración</option>
        </select>
        <button className="text-sm border border-border rounded px-3 py-2">Filtrar</button>
      </form>

      <div className="bg-white rounded border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary/60 border-b border-border">
              <th className="p-3">Fecha</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Acción</th>
              <th className="p-3">Recurso</th>
            </tr>
          </thead>
          <tbody>
            {((logs || []) as unknown as AuditLogRow[]).map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 align-top">
                <td className="p-3 text-primary/60 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                <td className="p-3">{log.admins?.email || "sistema"}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3 font-mono text-xs">
                  {log.resource_type}
                  {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {!error && (logs || []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-primary/50">
                  Sin registros de auditoría todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
