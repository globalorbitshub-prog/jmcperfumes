import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  verifyLoginChallenge,
  verifyTotpToken,
  verifyBackupCode,
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/admin/auth";
import { hashIp } from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const challenge = body?.challenge?.toString();
  const code = body?.code?.toString().trim();
  const useBackupCode = !!body?.useBackupCode;

  if (!challenge || !code) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }

  const payload = await verifyLoginChallenge(challenge);
  if (!payload) {
    return NextResponse.json(
      { error: "La sesión de verificación ha expirado. Inicia sesión de nuevo." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("id", payload.adminId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!admin || !admin.totp_secret) {
    return NextResponse.json({ error: "2FA no configurado para esta cuenta." }, { status: 400 });
  }

  let valid = false;
  let remainingBackupCodes: string[] | null = null;

  if (useBackupCode) {
    const codes: string[] = admin.totp_backup_codes || [];
    const idx = verifyBackupCode(code, codes);
    if (idx >= 0) {
      valid = true;
      remainingBackupCodes = codes.filter((_, i) => i !== idx);
    }
  } else {
    valid = verifyTotpToken(admin.totp_secret, code);
  }

  if (!valid) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  const sessionToken = await createSessionToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  await supabase.from("admin_sessions").insert({
    admin_id: admin.id,
    token_hash: hashSessionToken(sessionToken),
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    ip_address: hashIp(ip),
    user_agent: userAgent,
  });

  const update: Record<string, unknown> = {
    last_login: new Date().toISOString(),
    failed_login_attempts: 0,
  };
  if (remainingBackupCodes) update.totp_backup_codes = remainingBackupCodes;
  await supabase.from("admins").update(update).eq("id", admin.id);

  const res = NextResponse.json({
    ok: true,
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
