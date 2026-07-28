export const metadata = { title: "Términos y Condiciones" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-sm">
      <h1 className="font-heading text-3xl text-primary mb-6">Términos y Condiciones</h1>
      <p className="text-primary/80">
        El uso de este sitio web implica la aceptación de las presentes condiciones. JMC Perfumes
        se reserva el derecho de modificar precios y disponibilidad de productos sin previo aviso.
      </p>
      <h2 className="font-heading text-xl text-primary mt-6">Pedidos y pagos</h2>
      <p className="text-primary/80">
        Los pagos se procesan de forma segura a través de Stripe. El pedido se confirma una vez
        recibido el pago íntegro del importe.
      </p>
      <h2 className="font-heading text-xl text-primary mt-6">Propiedad intelectual</h2>
      <p className="text-primary/80">
        Todos los contenidos de este sitio (textos, imágenes, marca) son propiedad de JMC Perfumes
        o se usan bajo licencia.
      </p>
    </div>
  );
}
