// Edge-runtime-safe JWT helpers (pure Web Crypto via `jose`).
// Keep this file free of Node-only deps (bcryptjs, speakeasy, node:crypto) so
// it can be imported from middleware.ts, which runs in the Edge runtime.
import { SignJWT, jwtVerify } from "jose";

const SESSION_TTL_SECONDS = 30 * 60; // 30 minutes
const CHALLENGE_TTL_SECONDS = 60;
const SETUP_TTL_SECONDS = 5 * 60;

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("Missing ADMIN_JWT_SECRET env var.");
  return new TextEncoder().encode(secret);
}

export interface LoginChallengePayload {
  adminId: string;
  purpose: "2fa_challenge";
}
export async function createLoginChallenge(adminId: string): Promise<string> {
  return new SignJWT({ adminId, purpose: "2fa_challenge" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_TTL_SECONDS}s`)
    .sign(getJwtSecretKey());
}
export async function verifyLoginChallenge(
  token: string
): Promise<LoginChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (payload.purpose !== "2fa_challenge" || typeof payload.adminId !== "string") return null;
    return { adminId: payload.adminId, purpose: "2fa_challenge" };
  } catch {
    return null;
  }
}

export interface SetupTokenPayload {
  adminId: string;
  secret: string;
  purpose: "2fa_setup";
}
export async function createSetupToken(adminId: string, secret: string): Promise<string> {
  return new SignJWT({ adminId, secret, purpose: "2fa_setup" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SETUP_TTL_SECONDS}s`)
    .sign(getJwtSecretKey());
}
export async function verifySetupToken(token: string): Promise<SetupTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (
      payload.purpose !== "2fa_setup" ||
      typeof payload.adminId !== "string" ||
      typeof payload.secret !== "string"
    )
      return null;
    return { adminId: payload.adminId, secret: payload.secret, purpose: "2fa_setup" };
  } catch {
    return null;
  }
}

export interface SessionPayload {
  adminId: string;
  email: string;
  role: "super_admin" | "admin" | "moderator";
}
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecretKey());
}
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    )
      return null;
    return {
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "jmc_admin_session";
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
