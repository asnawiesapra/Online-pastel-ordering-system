-- ============================================================================
--  PASTEL ILIGAN — Row Level Security policies + RPC
--  Run AFTER schema.sql in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.stores               enable row level security;
alter table public.products             enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_select_store_owner on public.profiles;
create policy profiles_select_store_owner on public.profiles
  for select using (
    exists (select 1 from public.stores s where s.owner_id = public.profiles.id and s.owner_id = auth.uid())
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- CATEGORIES  (public read, admin write)
-- ---------------------------------------------------------------------------
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (true);

drop policy if exists categories_admin on public.categories;
create policy categories_admin on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- STORES  (public sees approved; owner sees own; admin sees all)
-- ---------------------------------------------------------------------------
drop policy if exists stores_read on public.stores;
create policy stores_read on public.stores
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

drop policy if exists stores_insert on public.stores;
create policy stores_insert on public.stores
  for insert with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists stores_update_owner on public.stores;
create policy stores_update_owner on public.stores
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists stores_delete_admin on public.stores;
create policy stores_delete_admin on public.stores
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- PRODUCTS  (readable when parent store is visible; owner/admin write)
-- ---------------------------------------------------------------------------
drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id
        and (s.status = 'approved' or s.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (
    exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- ORDERS  (customer sees own; store owner sees theirs; admin sees all)
-- ---------------------------------------------------------------------------
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.stores s where s.id = orders.store_id and s.owner_id = auth.uid())
  );

drop policy if exists orders_insert_customer on public.orders;
create policy orders_insert_customer on public.orders
  for insert with check (customer_id = auth.uid());

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
  for update using (
    public.is_admin()
    or exists (select 1 from public.stores s where s.id = orders.store_id and s.owner_id = auth.uid())
    or (customer_id = auth.uid() and status in ('pending', 'accepted'))
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.stores s where s.id = orders.store_id and s.owner_id = auth.uid())
    or customer_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- ORDER ITEMS  (visible/writable alongside parent order)
-- ---------------------------------------------------------------------------
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = auth.uid()
          or public.is_admin()
          or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
        )
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- ORDER STATUS HISTORY
-- ---------------------------------------------------------------------------
drop policy if exists history_read on public.order_status_history;
create policy history_read on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (
          o.customer_id = auth.uid()
          or public.is_admin()
          or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
        )
    )
  );

drop policy if exists history_insert on public.order_status_history;
create policy history_insert on public.order_status_history
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (
          o.customer_id = auth.uid()
          or public.is_admin()
          or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: place_order  — creates the order + items atomically, server-side totals
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_store_id     uuid,
  p_items        jsonb,
  p_fulfillment  fulfillment_type,
  p_note         text,
  p_contact_name text,
  p_contact_phone text,
  p_delivery_address text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_fee      numeric(10,2) := 0;
  v_store    public.stores;
  item       jsonb;
  v_product  public.products;
  v_qty      int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_store from public.stores where id = p_store_id;
  if not found then
    raise exception 'Store not found';
  end if;
  if v_store.status <> 'approved' or not v_store.is_open then
    raise exception 'Store is not accepting orders right now';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.orders (
    customer_id, store_id, status, fulfillment, note,
    contact_name, contact_phone, delivery_address
  ) values (
    auth.uid(), p_store_id, 'pending', p_fulfillment, coalesce(p_note, ''),
    coalesce(p_contact_name, ''), coalesce(p_contact_phone, ''),
    case when p_fulfillment = 'delivery' then p_delivery_address else null end
  ) returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((item->>'quantity')::int, 1));
    select * into v_product from public.products
      where id = (item->>'product_id')::uuid and store_id = p_store_id;
    if not found then
      raise exception 'Product % is not available at this store', item->>'product_id';
    end if;
    if not v_product.is_available then
      raise exception 'Product % is sold out', v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  if p_fulfillment = 'delivery' then
    v_fee := v_store.delivery_fee;
  end if;

  update public.orders
    set subtotal = v_subtotal,
        delivery_fee = v_fee,
        total = v_subtotal + v_fee
    where id = v_order_id;

  return v_order_id;
end $$;

grant execute on function public.place_order(uuid, jsonb, fulfillment_type, text, text, text, text) to authenticated;
