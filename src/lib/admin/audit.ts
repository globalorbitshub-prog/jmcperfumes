import { getSupabaseAdmin } from "@/lib/supabase";

export type AuditAction =
  | "create_product" | "edit_product" | "delete_product"
  | "create_order_refund" | "update_order_status"
  | "create_coupon" | "edit_coupon" | "delete_coupon"
  | "edit_admin" | "create_admin" | "suspend_admin" | "reactivate_admin"
  | "reset_admin_2fa" | "delete_admin"
  | "approve_review" | "reject_review" | "reply_review"
  | "update_settings";

export type AuditResource =
  | "product" | "order" | "review" | "coupon" | "admin" | "settings" | "subscriber";

export async function writeAuditLog(params: {
  adminId: string | null;
  action: AuditAction;
  resourceType: AuditResource;
  resourceId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddressHashed?: string;
  userAgent?: string;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from("audit_logs").insert({
    admin_id: params.adminId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    before_state: params.beforeState ?? null,
    after_state: params.afterState ?? null,
    ip_address_hashed: params.ipAddressHashed ?? null,
    user_agent: params.userAgent ?? null,
  });
}
