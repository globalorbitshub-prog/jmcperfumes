import bcrypt from "bcryptjs";
import crypto from "crypto";
import speakeasy from "speakeasy";

export * from "@/lib/admin/jwt";

export const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
export const PASSWORD_POLICY_MESSAGE =
  "La contraseña debe tener mínimo 12 caracteres, 1 mayúscula, 1 número y 1 carácter especial.";

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MINUTES = 15;

// ---------- Passwords ----------
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ---------- TOTP / 2FA ----------
export function generateTotpSecret(email: string) {
  return speakeasy.generateSecret({
    name: `JMC Perfumes (${email})`,
    length: 20,
  });
}

export function verifyTotpToken(secretBase32: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: "base32",
    token,
    window: 1, // allow 30s clock drift
  });
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase()
  );
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((c) => bcrypt.hashSync(c, 10));
}

export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  return hashedCodes.findIndex((h) => bcrypt.compareSync(code.toUpperCase(), h));
}

// ---------- Session token hashing (for admin_sessions.token_hash) ----------
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ---------- Misc ----------
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "jmc-static-salt";
  return crypto.createHash("sha256").update(salt + ip).digest("hex").slice(0, 32);
}

export function generateTempPassword(length = 16): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  if (!PASSWORD_POLICY.test(out)) return generateTempPassword(length);
  return out;
}
