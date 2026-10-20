-- ============================================================================
--  PASTEL ILIGAN — full database schema
--  Run this once in: Supabase Dashboard → SQL Editor → New query → Run
--  Safe to re-run (idempotent).
-- ============================================================================

create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists pgcrypto schema extensions;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('client', 'store', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type store_status as enum ('pending', 'approved', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_type as enum ('pickup', 'delivery');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PROFILES  (mirrors auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  phone       text,
  role        user_role not null default 'client',
  avatar_seed text not null default 'pastel',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default extensions.uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  emoji      text not null default '🥟',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- STORES
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id            uuid primary key default extensions.uuid_generate_v4(),
  owner_id      uuid references public.profiles(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text not null default '',
  address       text not null default '',
  barangay      text not null default 'Poblacion',
  phone         text,
  accent        text not null default 'mint',
  lat           numeric(9,6) not null default 8.2280,
  lng           numeric(9,6) not null default 124.2452,
  status        store_status not null default 'pending',
  is_open       boolean not null default true,
  prep_minutes  int not null default 20,
  delivery_fee  numeric(10,2) not null default 39.00,
  min_order     numeric(10,2) not null default 0,
  rating        numeric(2,1) not null default 4.8,
  hero_emoji    text not null default '🥟',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default extensions.uuid_generate_v4(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  name         text not null,
  description  text not null default '',
  price        numeric(10,2) not null check (price >= 0),
  unit         text not null default 'pc',
  emoji        text not null default '🥟',
  is_available boolean not null default true,
  is_featured  boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default extensions.uuid_generate_v4(),
  reference         text not null unique default ('PI-' || upper(substr(md5(random()::text), 1, 6))),
  customer_id       uuid not null references public.profiles(id) on delete cascade,
  store_id          uuid not null references public.stores(id) on delete cascade,
  status            order_status not null default 'pending',
  fulfillment       fulfillment_type not null default 'pickup',
  subtotal          numeric(10,2) not null default 0,
  delivery_fee      numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  note              text not null default '',
  contact_name      text not null default '',
  contact_phone     text not null default '',
  delivery_address  text,
  scheduled_for     timestamptz,
  cancel_reason     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default extensions.uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price   numeric(10,2) not null,
  quantity     int not null check (quantity > 0),
  line_total   numeric(10,2) not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ORDER STATUS HISTORY
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id          uuid primary key default extensions.uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      order_status not null,
  note        text not null default '',
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
create index if not exists idx_products_store   on public.products(store_id);
create index if not exists idx_products_cat     on public.products(category_id);
create index if not exists idx_stores_status    on public.stores(status);
create index if not exists idx_stores_owner     on public.stores(owner_id);
create index if not exists idx_orders_customer  on public.orders(customer_id, created_at desc);
create index if not exists idx_orders_store     on public.orders(store_id, created_at desc);
create index if not exists idx_orders_status    on public.orders(status);
create index if not exists idx_items_order      on public.order_items(order_id);
create index if not exists idx_history_order    on public.order_status_history(order_id, created_at);

-- ---------------------------------------------------------------------------
-- HELPERS
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_stores_touch on public.stores;
create trigger trg_stores_touch before update on public.stores
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_products_touch on public.products;
create trigger trg_products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Auto-create a profile whenever a user signs up.
-- First created user becomes admin only if they sign up with the bootstrap email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role user_role := 'client';
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  if lower(new.email) = 'admin@pater.ph' then
    v_role := 'admin';
  elsif (new.raw_user_meta_data->>'role') = 'store' then
    v_role := 'store';
  end if;

  insert into public.profiles (id, email, full_name, phone, role, avatar_seed)
  values (
    new.id,
    new.email,
    v_name,
    new.raw_user_meta_data->>'phone',
    v_role,
    substr(md5(new.id::text), 1, 6)
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role lookup that bypasses RLS (prevents recursive policy evaluation).
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

-- Log every status change automatically.
create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  elsif (tg_op = 'UPDATE' and new.status <> old.status) then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists trg_order_status_ins on public.orders;
create trigger trg_order_status_ins after insert on public.orders
  for each row execute function public.log_order_status();

drop trigger if exists trg_order_status_upd on public.orders;
create trigger trg_order_status_upd after update on public.orders
  for each row execute function public.log_order_status();
