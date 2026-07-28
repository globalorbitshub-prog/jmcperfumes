import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { hashIp } from "@/lib/admin/auth";
import { generateUnsubscribeToken } from "@/lib/newsletter";

const GDPR_CONSENT_TEXT_V1 =
  "Acepto recibir comunicaciones comerciales de JMC Perfumes por email y he leído la política de privacidad.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim().toLowerCase();
  const name = body?.name?.toString().trim() || null;
  const source = body?.source || "landing";
  const gdprConsent = !!body?.gdprConsent;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }
  if (!gdprConsent) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, verified, unsubscribed")
    .eq("email", email)
    .maybeSingle();

  if (existing && existing.verified && !existing.unsubscribed) {
    return NextResponse.json({ ok: true, alreadySubscribed: true });
  }

  const verificationToken = crypto.randomBytes(16).toString("hex");
  const now = new Date().toISOString();

  if (existing) {
    await supabase
      .from("subscribers")
      .update({
        name,
        source,
        verification_token: verificationToken,
        gdpr_consent: true,
        gdpr_date: now,
        gdpr_consent_text: GDPR_CONSENT_TEXT_V1,
        unsubscribed: false,
        updated_at: now,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("subscribers").insert({
      email,
      name,
      source,
      verification_token: verificationToken,
      gdpr_consent: true,
      gdpr_date: now,
      gdpr_consent_text: GDPR_CONSENT_TEXT_V1,
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await supabase.from("gdpr_consent_records").insert({
    email,
    consent_text: GDPR_CONSENT_TEXT_V1,
    ip_address_hashed: hashIp(ip),
    user_agent: req.headers.get("user-agent") || "unknown",
    version: "1.0",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jmcperfumes.es";
  const verifyUrl = `${siteUrl}/verify?token=${verificationToken}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${generateUnsubscribeToken(email)}`;
  await sendMail({
    to: email,
    subject: "Confirma tu suscripción a JMC Perfumes",
    html: `<p>¡Gracias por suscribirte!</p><p>Confirma tu email haciendo clic aquí: <a href="${verifyUrl}">${verifyUrl}</a></p><p>Este enlace caduca en 7 días.</p><p style="font-size:12px;color:#888">Si no quieres recibir más emails, puedes <a href="${unsubscribeUrl}">darte de baja aquí</a>.</p>`,
  });

  return NextResponse.json({ ok: true });
}
