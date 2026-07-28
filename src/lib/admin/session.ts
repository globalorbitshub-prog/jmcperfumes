import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  verifySessionToken,
} from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Reads and validates the admin session cookie for the current request.
 * Returns null if there is no valid, non-expired session.
 */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function requireRole(
  roles: Array<"super_admin" | "admin" | "moderator">
): Promise<SessionPayload> {
  const session = await requireAdminSession();
  if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function getActiveAdminRecord(adminId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("id", adminId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}
