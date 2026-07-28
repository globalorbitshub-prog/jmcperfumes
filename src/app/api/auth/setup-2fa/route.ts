import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  verifyLoginChallenge,
  generateTotpSecret,
  verifyTotpToken,
  generateBackupCodes,
  hashBackupCodes,
  createSessionToken,
  hashSessionToken,
  hashIp,
  createSetupToken,
  verifySetupToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/admin/auth";

// Step 1: generate a fresh TOTP secret + QR code for the account to scan.
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge");
  if (!challenge) {
    return NextResponse.json({ error: "Falta el parámetro challenge." }, { status: 400 });
  }
  const payload = await verifyLoginChallenge(challenge);
  if (!payload) {
    return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: admin } = await supabase
    .from("admins")
    .select("id, email, totp_secret")
    .eq("id", payload.adminId)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 });

  const secret = generateTotpSecret(admin.email);
  const otpauthUrl = secret.otpauth_url!;
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  const setupToken = await createSetupToken(admin.id, secret.base32);

  return NextResponse.json({
    setupToken,
    qrDataUrl,
    secretBase32: secret.base32,
  });
}

// Step 2: confirm the 6-digit code, persist the secret + backup codes, start session.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const setupToken = body?.setupToken?.toString();
  const code = body?.code?.toString().trim();
  if (!setupToken || !code) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }

  const payload = await verifySetupToken(setupToken);
  if (!payload) {
    return NextResponse.json({ error: "Token de configuración expirado." }, { status: 401 });
  }

  if (!verifyTotpToken(payload.secret, code)) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("id", payload.adminId)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 });

  const backupCodes = generateBackupCodes(8);
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await supabase
    .from("admins")
    .update({
      totp_secret: payload.secret,
      totp_backup_codes: hashedBackupCodes,
      status: "active",
      last_login: new Date().toISOString(),
      failed_login_attempts: 0,
    })
    .eq("id", admin.id);

  const sessionToken = await createSessionToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await supabase.from("admin_sessions").insert({
    admin_id: admin.id,
    token_hash: hashSessionToken(sessionToken),
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    ip_address: hashIp(ip),
    user_agent: req.headers.get("user-agent") || "unknown",
  });

  const res = NextResponse.json({
    ok: true,
    backupCodes, // shown once, client must display + allow download
    mustChangePassword: !!admin.never_changed_password,
  });
  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
