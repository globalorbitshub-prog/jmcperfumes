import crypto from "crypto";

function getSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.ADMIN_JWT_SECRET || "jmc-fallback-secret";
}

export function generateUnsubscribeToken(email: string): string {
  return crypto.createHmac("sha256", getSecret()).update(email.toLowerCase()).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
