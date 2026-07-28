"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Falta el token de verificación.");
      return;
    }
    fetch(`/api/subscribers/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setStatus("error");
          setError(data.error);
        } else {
          setStatus("ok");
        }
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      {status === "loading" && <p>Verificando...</p>}
      {status === "ok" && (
        <>
          <p className="text-3xl mb-2">🎉</p>
          <h1 className="font-heading text-2xl text-primary mb-2">¡Bienvenido!</h1>
          <p className="text-primary/70 mb-6">Tu suscripción ha sido confirmada.</p>
          <Link href="/" className="text-secondary underline">
            Volver al inicio
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="font-heading text-2xl text-primary mb-2">Enlace no válido</h1>
          <p className="text-primary/70">{error}</p>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
