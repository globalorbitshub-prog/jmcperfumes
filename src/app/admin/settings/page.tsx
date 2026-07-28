"use client";

import { useEffect, useState } from "react";

interface ShippingRate {
  [key: string]: string | number;
  country: string;
  base_rate: number;
  rate_per_kg: number;
  free_above: number;
}
interface TaxRate {
  [key: string]: string | number;
  country: string;
  tax_percent: number;
}

const TABS = ["Tienda", "Branding", "Pagos", "Envío", "Impuestos", "General"];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState("Tienda");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [saved, setSaved] = useState(false);

  async function load() {
    const [s, sr, tr] = await Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/shipping-rates").then((r) => r.json()),
      fetch("/api/admin/tax-rates").then((r) => r.json()),
    ]);
    setSettings(s.settings || {});
    setShippingRates(sr.rates || []);
    setTaxRates(tr.rates || []);
  }

  useEffect(() => {
    load();
  }, []);

  function set(key: string, value: unknown) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function saveSettings() {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveShippingRow(rate: ShippingRate) {
    await fetch("/api/admin/shipping-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: rate.country,
        baseRate: rate.base_rate,
        ratePerKg: rate.rate_per_kg,
        freeAbove: rate.free_above,
      }),
    });
  }

  async function saveTaxRow(rate: TaxRate) {
    await fetch("/api/admin/tax-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: rate.country, taxPercent: rate.tax_percent }),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl text-primary">Configuración</h1>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm ${
              tab === t ? "bg-secondary text-white" : "bg-white border border-border text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white border border-border rounded p-6 max-w-2xl space-y-4">
        {tab === "Tienda" && (
          <>
            <TextField label="Nombre de la tienda" value={settings.store_name} onChange={(v) => set("store_name", v)} />
            <TextField label="Email de contacto" value={settings.store_email} onChange={(v) => set("store_email", v)} />
            <TextField label="Teléfono" value={settings.store_phone} onChange={(v) => set("store_phone", v)} />
          </>
        )}

        {tab === "Branding" && (
          <>
            <ColorField label="Color primario" value={settings.colors_primary} onChange={(v) => set("colors_primary", v)} />
            <ColorField label="Color secundario" value={settings.colors_secondary} onChange={(v) => set("colors_secondary", v)} />
            <ColorField label="Color acento" value={settings.colors_accent} onChange={(v) => set("colors_accent", v)} />
          </>
        )}

        {tab === "Pagos" && (
          <>
            <TextField label="Stripe Connect ID del colega" value={settings.stripe_connect_id} onChange={(v) => set("stripe_connect_id", v)} />
            <TextField label="% comisión de la plataforma" value={settings.commission_percentage} onChange={(v) => set("commission_percentage", Number(v))} type="number" />
          </>
        )}

        {tab === "Envío" && (
          <RatesTable
            rows={shippingRates}
            onChange={setShippingRates}
            onSaveRow={saveShippingRow}
            columns={[
              { key: "country", label: "País" },
              { key: "base_rate", label: "Tarifa base (€)" },
              { key: "rate_per_kg", label: "€/kg adicional" },
              { key: "free_above", label: "Gratis si > (€)" },
            ]}
          />
        )}

        {tab === "Impuestos" && (
          <RatesTable
            rows={taxRates}
            onChange={setTaxRates}
            onSaveRow={saveTaxRow}
            columns={[
              { key: "country", label: "País" },
              { key: "tax_percent", label: "% IVA" },
            ]}
          />
        )}

        {tab === "General" && (
          <>
            <SelectField
              label="Modo tienda"
              value={settings.store_status}
              onChange={(v) => set("store_status", v)}
              options={["active", "paused", "closed"]}
            />
            <TextField
              label="Umbral stock bajo"
              value={settings.stock_threshold}
              onChange={(v) => set("stock_threshold", Number(v))}
              type="number"
            />
            <TextField label="Google Analytics ID (GA4)" value={settings.ga4_id} onChange={(v) => set("ga4_id", v)} />
            <TextField label="Google AdSense ID" value={settings.adsense_id} onChange={(v) => set("adsense_id", v)} />
          </>
        )}

        {tab !== "Envío" && tab !== "Impuestos" && (
          <button onClick={saveSettings} className="bg-secondary hover:bg-accent transition text-white rounded px-4 py-2 text-sm">
            {saved ? "Guardado ✓" : "Guardar cambios"}
          </button>
        )}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-primary mb-1">{label}</label>
      <input
        type={type}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-primary mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={(value as string) || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 border border-border rounded" />
        <input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="border border-border rounded px-3 py-2 text-sm flex-1" />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm text-primary mb-1">{label}</label>
      <select value={(value as string) ?? options[0]} onChange={(e) => onChange(e.target.value)} className="w-full border border-border rounded px-3 py-2 text-sm">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function RatesTable<T extends { country: string } & Record<string, string | number>>({
  rows,
  onChange,
  onSaveRow,
  columns,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  onSaveRow: (row: T) => void;
  columns: { key: string; label: string }[];
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-primary/60 border-b border-border">
          {columns.map((c) => (
            <th key={c.key} className="p-2">
              {c.label}
            </th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.country} className="border-b border-border last:border-0">
            {columns.map((c) => (
              <td key={c.key} className="p-2">
                <input
                  value={row[c.key] ?? ""}
                  disabled={c.key === "country"}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = {
                      ...next[i],
                      [c.key]: c.key === "country" ? e.target.value : Number(e.target.value),
                    };
                    onChange(next);
                  }}
                  className="border border-border rounded px-2 py-1 w-24"
                />
              </td>
            ))}
            <td className="p-2">
              <button onClick={() => onSaveRow(row)} className="text-secondary text-xs underline">
                Guardar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
