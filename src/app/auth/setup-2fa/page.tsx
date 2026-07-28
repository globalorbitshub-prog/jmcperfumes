"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SetupTwoFactorForm() {
  const router = useRouter();
  const params = useSearchParams();
  const challenge = params.get("challenge") || "";

  const [setupToken, setSetupToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secretBase32, setSecretBase32] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (!challenge) return;
    fetch(`/api/auth/setup-2fa?challenge=${encodeURIComponent(challenge)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setSetupToken(data.setupToken);
        setQrDataUrl(data.qrDataUrl);
        setSecretBase32(data.secretBase32);
      });
  }, [challenge]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupToken, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Código incorrecto.");
        return;
      }
      setBackupCodes(data.backupCodes);
      setMustChangePassword(!!data.mustChangePassword);
    } finally {
      setLoading(false);
    }
  }

  if (backupCodes) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-xl text-primary">Guarda tus códigos de recuperación</h2>
        <p className="text-sm text-error font-medium">
          GUARDA ESTOS CÓDIGOS EN LUGAR SEGURO. No volverán a mostrarse.
        </p>
        <div className="bg-primary/5 rounded p-4 font-mono text-sm grid grid-cols-2 gap-2">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button
          onClick={() => {
            const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "jmc-perfumes-backup-codes.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full border border-secondary text-secondary rounded py-2"
        >
          Descargar códigos
        </button>
        <button
          onClick={() =>
            router.push(mustChangePassword ? "/auth/change-password" : "/admin/dashboard")
          }
          className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 font-medium"
        >
          Entendido, continuar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-heading text-xl text-primary mb-2">Configura tu autenticador</h2>
      {error && <p className="text-error text-sm bg-error/10 rounded p-2">{error}</p>}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-2">
          {/* Server-generated QR data URL (not a remote user-controlled image). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Código QR de configuración 2FA" className="w-48 h-48" />
          <p className="text-xs text-primary/60 font-mono break-all text-center">{secretBase32}</p>
        </div>
      )}
      <input
        type="text"
        required
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        className="w-full border border-border rounded px-3 py-2 text-center tracking-widest font-mono outline-none focus:border-secondary transition"
      />
      <button
        type="submit"
        disabled={loading || !setupToken}
        className="w-full bg-secondary hover:bg-accent transition text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Verificando..." : "Activar 2FA"}
      </button>
    </form>
  );
}

export default function SetupTwoFactorPage() {
  return (
    <Suspense>
      <SetupTwoFactorForm />
    </Suspense>
  );
}
