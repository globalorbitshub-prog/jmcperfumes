// Best-effort in-memory IP rate limiter for the login endpoint.
// NOTE: state is per server instance — on serverless/multi-instance deployments
// this is not a global guarantee. The authoritative brake against credential
// stuffing is the per-account failed_login_attempts + locked_until in Postgres.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkIpRateLimit(
  ip: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
