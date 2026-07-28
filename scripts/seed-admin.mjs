// Bootstraps (or updates) the initial super_admin account.
// Reads credentials from environment variables so no real password ever
// gets committed to source control.
//
// Usage:
//   ADMIN_SEED_EMAIL=you@example.com \
//   ADMIN_SEED_PASSWORD='a-strong-12+char-password!' \
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/seed-admin.mjs

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_SEED_EMAIL;
const password = process.env.ADMIN_SEED_PASSWORD;
const name = process.env.ADMIN_SEED_NAME || "Super Admin";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error("Missing ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD env vars.");
  process.exit(1);
}
if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
if (!PASSWORD_POLICY.test(password)) {
  console.error(
    "Password does not meet policy: min 12 chars, 1 uppercase, 1 number, 1 special character."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const passwordHash = bcrypt.hashSync(password, 12);

const { data: existing } = await supabase
  .from("admins")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (existing) {
  const { error } = await supabase
    .from("admins")
    .update({
      password_hash: passwordHash,
      name,
      role: "super_admin",
      status: "active",
      totp_secret: null, // forces 2FA setup on next login
      failed_login_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (error) throw error;
  console.log(`Updated existing super_admin: ${email}`);
} else {
  const { error } = await supabase.from("admins").insert({
    email,
    password_hash: passwordHash,
    name,
    role: "super_admin",
    status: "active",
    totp_secret: null,
  });
  if (error) throw error;
  console.log(`Created super_admin: ${email}`);
}

console.log("2FA is not set up yet — the account will be prompted to set up TOTP on first login.");
