-- Product size variants (e.g. decants: 2ml, 5ml, 10ml with independent prices/stock).
-- A product with no rows here is sold as a single item at products.price/products.stock,
-- exactly as before. A product with rows here is sold only in those sizes.
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size_ml numeric(6,2) not null check (size_ml > 0),
  price numeric(10,2) not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  "order" int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_product_variants_product on product_variants (product_id);

alter table product_variants enable row level security;

create policy "public read product variants" on product_variants
  for select using (
    exists (
      select 1 from products
      where products.id = product_variants.product_id
      and products.published = true
      and products.deleted_at is null
    )
  );

create or replace function decrement_variant_stock(v_id uuid, v_qty int)
returns void as $$
begin
  update product_variants set stock = greatest(0, stock - v_qty), updated_at = now() where id = v_id;
end;
$$ language plpgsql;

-- Stock holds during checkout need to track which size variant was selected,
-- since each size has its own independent stock count.
alter table order_holds add column variant_id uuid references product_variants(id) on delete cascade;

