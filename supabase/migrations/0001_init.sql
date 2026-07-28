-- JMC Perfumes - Initial schema
-- Extensions
create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================
create type admin_role as enum ('super_admin', 'admin', 'moderator');
create type admin_status as enum ('active', 'pending_validation', 'suspended');
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'requested_return', 'refunded');
create type refund_status as enum ('pending', 'succeeded', 'failed');
create type subscriber_source as enum ('banner', 'popup', 'landing', 'exit-intent', 'checkout');
create type coupon_discount_type as enum ('percentage', 'fixed');
create type support_status as enum ('open', 'in_progress', 'closed');
create type audit_action as enum (
  'create_product', 'edit_product', 'delete_product',
  'create_order_refund', 'update_order_status',
  'create_coupon', 'edit_coupon', 'delete_coupon',
  'edit_admin', 'create_admin', 'suspend_admin', 'reactivate_admin', 'reset_admin_2fa', 'delete_admin',
  'approve_review', 'reject_review', 'reply_review',
  'update_settings'
);
create type audit_resource as enum ('product', 'order', 'review', 'coupon', 'admin', 'settings', 'subscriber');

-- =========================================================
-- PUBLIC TABLES
-- =========================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  icon text,
  color text,
  description text,
  "order" int default 0,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  description_long text,
  price numeric(10,2) not null check (price >= 0),
  category_id uuid references categories(id) on delete set null,
  image_urls text[] default '{}',
  image_alts text[] default '{}',
  notes_top text,
  notes_heart text,
  notes_base text,
  stock int not null default 0 check (stock >= 0),
  product_weight numeric(6,3) default 0.5,
  wallapop_url text,
  vinted_url text,
  featured boolean default false,
  published boolean default false,
  seo_description text,
  seo_keywords text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create index idx_products_category_published on products (category_id, published);
create index idx_products_slug on products (slug);
create index idx_products_featured on products (featured);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_email text not null,
  user_name text not null,
  rating int not null check (rating between 1 and 5),
  text text check (char_length(text) <= 300),
  verified boolean default false,
  rejected boolean default false,
  response_admin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_reviews_product_verified on reviews (product_id, verified);

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  user_email text not null,
  user_name text,
  user_phone text,
  address text,
  city text,
  postal_code text,
  country text,
  products_json jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  coupon_applied text,
  coupon_discount numeric(10,2) default 0,
  tax numeric(10,2) default 0,
  shipping numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  stripe_payment_id text unique,
  status order_status not null default 'pending',
  tracking_number text,
  created_at timestamptz default now(),
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes_admin text
);
create index idx_orders_email_status on orders (user_email, status);
create index idx_orders_stripe_payment on orders (stripe_payment_id);

create table order_holds (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_email text not null,
  quantity int not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
create index idx_order_holds_expires on order_holds (expires_at);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  stripe_refund_id text unique,
  amount numeric(10,2) not null,
  reason text,
  status refund_status default 'pending',
  created_at timestamptz default now(),
  processed_at timestamptz
);

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  subscribed_at timestamptz default now(),
  verified boolean default false,
  verification_token text unique,
  verified_at timestamptz,
  source subscriber_source not null default 'landing',
  categories text[] default '{}',
  gdpr_consent boolean not null default false,
  gdpr_date timestamptz,
  gdpr_consent_text text,
  unsubscribed boolean default false,
  unsubscribed_at timestamptz,
  updated_at timestamptz default now(),
  retention_until timestamptz
);
create index idx_subscribers_email on subscribers (email);

create table gdpr_consent_records (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consent_text text not null,
  ip_address_hashed text,
  user_agent text,
  "timestamp" timestamptz default now(),
  version text default '1.0'
);

create table abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  products_json jsonb not null default '[]',
  created_at timestamptz default now(),
  email_sent boolean default false,
  email_sent_at timestamptz,
  recovered boolean default false
);
create index idx_abandoned_carts_email on abandoned_carts (user_email);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type coupon_discount_type not null,
  discount_value numeric(10,2) not null,
  max_uses int,
  uses_count int default 0,
  expires_at timestamptz,
  applicable_categories text[],
  min_purchase numeric(10,2) default 0,
  created_at timestamptz default now(),
  active boolean default true
);
create index idx_coupons_code_active on coupons (code, active);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subject text not null,
  message text not null,
  status support_status default 'open',
  admin_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  messages_json jsonb default '[]'
);

create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  country text unique not null,
  base_rate numeric(10,2) not null default 0,
  rate_per_kg numeric(10,2) not null default 0,
  free_above numeric(10,2) default 50,
  updated_at timestamptz default now()
);

create table tax_rates (
  id uuid primary key default gen_random_uuid(),
  country text unique not null,
  tax_percent numeric(5,2) not null default 21,
  updated_at timestamptz default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- =========================================================
-- PRIVATE (ADMIN) TABLES
-- =========================================================

create table admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  role admin_role not null default 'admin',
  status admin_status not null default 'pending_validation',
  totp_secret text,
  totp_backup_codes text[],
  never_changed_password boolean default false,
  last_login timestamptz,
  failed_login_attempts int default 0,
  locked_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);
create index idx_admin_sessions_admin on admin_sessions (admin_id);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete set null,
  action audit_action not null,
  resource_type audit_resource not null,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address_hashed text,
  user_agent text,
  "timestamp" timestamptz default now(),
  retention_until timestamptz default (now() + interval '2 years')
);
create index idx_audit_logs_admin_time on audit_logs (admin_id, "timestamp");
create index idx_audit_logs_resource on audit_logs (resource_type, resource_id);

-- =========================================================
-- RLS POLICIES
-- =========================================================
alter table products enable row level security;
alter table categories enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;
alter table order_holds enable row level security;
alter table refunds enable row level security;
alter table subscribers enable row level security;
alter table gdpr_consent_records enable row level security;
alter table abandoned_carts enable row level security;
alter table coupons enable row level security;
alter table support_tickets enable row level security;
alter table shipping_rates enable row level security;
alter table tax_rates enable row level security;
alter table settings enable row level security;
alter table admins enable row level security;
alter table admin_sessions enable row level security;
alter table audit_logs enable row level security;

-- Public read policies (service role bypasses RLS for admin operations via server-side client)
create policy "public read published products" on products
  for select using (published = true and deleted_at is null);

create policy "public read categories" on categories
  for select using (true);

create policy "public read verified reviews" on reviews
  for select using (verified = true);

create policy "public insert reviews" on reviews
  for insert with check (true);

create policy "public insert orders" on orders
  for insert with check (true);

create policy "public read shipping rates" on shipping_rates
  for select using (true);

create policy "public read tax rates" on tax_rates
  for select using (true);

create policy "public insert subscribers" on subscribers
  for insert with check (true);

create policy "public insert gdpr records" on gdpr_consent_records
  for insert with check (true);

create policy "public insert support tickets" on support_tickets
  for insert with check (true);

-- All writes to products/orders(update)/admins/audit_logs/settings/coupons are performed
-- via the server-side Supabase client using the service_role key, which bypasses RLS.
-- No anon-key write policies are granted for those beyond what is declared above.

-- =========================================================
-- FUNCTIONS
-- =========================================================
create or replace function decrement_product_stock(p_id uuid, p_qty int)
returns void as $$
begin
  update products set stock = greatest(0, stock - p_qty), updated_at = now() where id = p_id;
end;
$$ language plpgsql;

-- =========================================================
-- SEED DEFAULT SETTINGS
-- =========================================================
insert into settings (key, value) values
  ('store_name', '"JMC Perfumes"'),
  ('store_email', '"contacto@jmcperfumes.es"'),
  ('store_phone', '""'),
  ('stripe_connect_id', '""'),
  ('commission_percentage', '3'),
  ('store_status', '"active"'),
  ('colors_primary', '"#2D2D2D"'),
  ('colors_secondary', '"#8B6F9E"'),
  ('colors_accent', '"#D4A574"'),
  ('iva_percentage', '21'),
  ('stock_threshold', '5'),
  ('data_retention_days', '730'),
  ('ga4_id', '""'),
  ('adsense_id', '""')
on conflict (key) do nothing;

insert into shipping_rates (country, base_rate, rate_per_kg, free_above) values
  ('ES', 4.95, 1.5, 50),
  ('FR', 7.95, 2, 50),
  ('PT', 6.95, 2, 50),
  ('DE', 7.95, 2, 50),
  ('IT', 7.95, 2, 50)
on conflict (country) do nothing;

insert into tax_rates (country, tax_percent) values
  ('ES', 21), ('FR', 20), ('PT', 23), ('DE', 19), ('IT', 22)
on conflict (country) do nothing;
