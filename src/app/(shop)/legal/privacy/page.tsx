export const metadata = { title: "Política de Privacidad" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-sm">
      <h1 className="font-heading text-3xl text-primary mb-6">Política de Privacidad</h1>
      <p className="text-primary/80">
        En JMC Perfumes tratamos tus datos personales de acuerdo con el Reglamento General de
        Protección de Datos (RGPD). Recopilamos únicamente los datos necesarios para procesar tus
        pedidos y, si lo consientes, enviarte comunicaciones comerciales.
      </p>
      <h2 className="font-heading text-xl text-primary mt-6">Datos que recopilamos</h2>
      <p className="text-primary/80">
        Nombre, email, teléfono, dirección de envío y datos de facturación necesarios para
        gestionar tu compra. El pago se procesa directamente por Stripe; no almacenamos datos de
        tarjetas.
      </p>
      <h2 className="font-heading text-xl text-primary mt-6">Tus derechos</h2>
      <p className="text-primary/80">
        Puedes solicitar acceso, rectificación, supresión u oposición al tratamiento de tus datos
        escribiendo a contacto@jmcperfumes.es. Conservamos los datos de suscripción a nuestra
        newsletter durante 2 años tras la baja, conforme a nuestras obligaciones legales.
      </p>
    </div>
  );
}
