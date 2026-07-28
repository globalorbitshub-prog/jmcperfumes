import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  createLoginChallenge,
  verifyPassword,
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCK_DURATION_MINUTES,
} from "@/lib/admin/auth";
import { checkIpRateLimit } from "@/lib/admin/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkIpRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = body?.email?.toString().trim().toLowerCase();
  const password = body?.password?.toString();

  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  }

  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    return NextResponse.json(
      { error: "Cuenta bloqueada temporalmente por intentos fallidos. Inténtalo más tarde." },
      { status: 423 }
    );
  }

  if (admin.status === "pending_validation") {
    return NextResponse.json(
      { error: "Tu cuenta está pendiente de validación por un super administrador." },
      { status: 403 }
    );
  }
  if (admin.status === "suspended") {
    return NextResponse.json({ error: "Tu cuenta ha sido suspendida." }, { status: 403 });
  }

  const passwordOk = verifyPassword(password, admin.password_hash);
  if (!passwordOk) {
    const failedAttempts = (admin.failed_login_attempts || 0) + 1;
    const update: Record<string, unknown> = { failed_login_attempts: failedAttempts };
    if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      update.locked_until = new Date(
        Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
      ).toISOString();
    }
    await supabase.from("admins").update(update).eq("id", admin.id);
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  }

  // Reset failed attempts on successful password check
  await supabase
    .from("admins")
    .update({ failed_login_attempts: 0, locked_until: null })
    .eq("id", admin.id);

  const challenge = await createLoginChallenge(admin.id);
  const requiresSetup = !admin.totp_secret;

  return NextResponse.json({
    challenge,
    requires2faSetup: requiresSetup,
    mustChangePassword: !!admin.never_changed_password,
  });
}
