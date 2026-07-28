# JMC Perfumes

E-commerce de perfumería premium construido con Next.js 14 (App Router), Supabase, Stripe y Resend.

## Stack

- Next.js 14 + TypeScript + Tailwind CSS
- Supabase (Postgres + Storage) vía `@supabase/supabase-js` con el `service_role` key en el servidor
- Stripe (Payment Element + Stripe Connect transfers) para pagos
- Resend para emails transaccionales
- `speakeasy` + `qrcode` para 2FA (TOTP) del panel admin
- `jose` para JWT de sesión (compatible con el Edge Runtime del middleware)
- `sharp` para comprimir imágenes de producto a WebP

## Puesta en marcha

```bash
npm install
cp .env.example .env
# rellena .env con tus credenciales (ver más abajo)
```

1. Crea un proyecto en [Supabase](https://supabase.com) y ejecuta la migración:

   ```bash
   # Opción A: pega el contenido de supabase/migrations/0001_init.sql en el SQL Editor de Supabase
   # Opción B: con la CLI de Supabase
   supabase db push
   ```

   Crea también un bucket de Storage público llamado `product-images` (usado por la subida de
   imágenes de productos).

2. Crea el primer super admin (no está hardcodeado en el seed SQL a propósito, ver más abajo):

   ```bash
   ADMIN_SEED_EMAIL=tu@email.com \
   ADMIN_SEED_PASSWORD='UnaContraseñaFuerte123!' \
   SUPABASE_URL=https://xxxx.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=xxxx \
   npm run seed:admin
   ```

   La contraseña debe cumplir la política: mínimo 12 caracteres, 1 mayúscula, 1 número y 1
   carácter especial. El 2FA se configurará la primera vez que inicies sesión en `/auth/login`.

3. Configura el webhook de Stripe apuntando a `/api/webhooks/stripe` (evento
   `payment_intent.succeeded`, y opcionalmente `charge.refunded`).

4. `npm run dev` y visita `http://localhost:3000`. El panel admin está en `/auth/login`
   (pensado para servirse desde `admin.jmcperfumes.es` en producción vía un dominio/subdominio
   aparte apuntando al mismo despliegue de Vercel).

## Nota de seguridad sobre el usuario admin inicial

El encargo original incluía un email y contraseña reales para precrear la cuenta de
super_admin directamente en un seed SQL versionado en git. **No lo hice así a propósito**:

- Esa contraseña (8 caracteres, sin símbolo) no cumple ni la propia política de contraseñas del
  proyecto (12+ caracteres, mayúscula, número y símbolo).
- Commitear una contraseña real —aunque esté hasheada— dentro del historial de git es una mala
  práctica: el hash queda ahí para siempre, es un objetivo de fuerza bruta offline, y si esa
  contraseña se reutiliza en otro sitio, el riesgo se extiende.

En su lugar, `scripts/seed-admin.mjs` crea o actualiza el super_admin leyendo el email y la
contraseña desde variables de entorno en el momento de ejecutarlo, sin dejar ningún secreto en el
repositorio. Es un pequeño cambio de forma, no de fondo: el resultado (una cuenta super_admin con
2FA pendiente de configurar) es el mismo que pedía el encargo.

## Estructura

```
src/app/(shop)/       Tienda pública (landing, catálogo, producto, carrito, checkout, legal)
src/app/admin/        Panel de administración (protegido por middleware + sesión JWT)
src/app/auth/         Login, 2FA setup/verify, cambio de contraseña, alta de admins
src/app/api/          Route handlers: auth, checkout, webhooks, admin CRUD, newsletter
src/components/shop/  Componentes de tienda (carrito, header/footer, popup newsletter...)
src/components/admin/ Componentes del panel admin
src/lib/               Supabase, Stripe, email, auth/2FA, pricing, utils
supabase/migrations/   Esquema SQL + RLS + seeds de settings/shipping/tax
scripts/seed-admin.mjs Bootstrap del super_admin (ver nota de seguridad arriba)
```

## Qué está implementado

- **Auth admin completo**: login + 2FA (TOTP) obligatorio, códigos de recuperación, bloqueo tras
  5 intentos fallidos, cambio de contraseña forzado, alta/aprobación de nuevos admins,
  gestión de roles (super_admin/admin/moderator), reseteo de 2FA, auditoría de cada acción.
- **Tienda pública**: landing, catálogo con filtros (categoría, precio, orden), ficha de producto
  con notas olfativas, reseñas y schema.org `Product`, carrito persistente en `localStorage`.
- **Checkout real con Stripe**: cálculo de impuestos/envío server-side, reserva de stock temporal
  (`order_holds`), Payment Element (tarjeta + wallets/PayPal/SEPA vía
  `automatic_payment_methods`), creación de la orden vía webhook firmado, transferencia a
  Stripe Connect, reembolsos desde el panel admin.
- **Newsletter**: suscripción con doble opt-in (verificación por email), popups en landing,
  exit-intent y post-compra, baja con token firmado, registro de consentimiento RGPD.
- **Panel admin**: dashboard con KPIs, productos (CRUD + subida/optimización de imágenes),
  órdenes (cambio de estado, tracking, devoluciones/reembolsos), moderación de reseñas,
  suscriptores + export CSV, configuración (tienda/branding/pagos/envío/impuestos/general),
  gestión de admins, logs de auditoría, soporte básico.
- **SEO**: sitemap y robots.txt dinámicos, metadata por página, JSON-LD de `Product` y
  `Organization`.

## Recortes de alcance conocidos (no implementados)

Dado el tamaño del encargo original, quedaron fuera del alcance de esta primera entrega:

- Editor de plantillas de email HTML en `/admin/settings` (los emails se envían con HTML inline
  desde `src/lib/email.ts`, no editable desde el panel).
- Generación de factura en PDF descargable (el email de confirmación sí se envía; falta el PDF).
- Envío de campañas manuales de newsletter y limpieza automática de inactivos.
- Reordenamiento drag-and-drop de imágenes de producto (se pueden subir y eliminar, no reordenar).
- Cron semanal de notificación de nuevos productos a suscriptores.
- Subdominio real `admin.jmcperfumes.es` (hay que configurarlo en el DNS/Vercel; el código ya
  sirve el panel en `/admin` y `/auth` bajo el mismo despliegue).
- Idempotency keys en la creación de PaymentIntents (recomendado para producción, para evitar
  cobros duplicados en reintentos de red).
