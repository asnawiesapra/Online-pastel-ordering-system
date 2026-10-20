-- ============================================================================
--  PASTEL ILIGAN — 002: delivery coordinates (Grab-style address picker)
--  Run AFTER 001_add_images.sql. Safe to re-run.
-- ============================================================================

alter table public.orders add column if not exists delivery_lat      numeric(9,6);
alter table public.orders add column if not exists delivery_lng      numeric(9,6);
alter table public.orders add column if not exists delivery_barangay text;
alter table public.orders add column if not exists delivery_landmark text;
alter table public.orders add column if not exists address_label     text;
alter table public.orders add column if not exists eta_minutes       int;

create index if not exists idx_orders_delivery_coords
  on public.orders(delivery_lat, delivery_lng);

-- ---------------------------------------------------------------------------
-- RPC: place_order (now accepts delivery coordinates + eta)
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_store_id          uuid,
  p_items             jsonb,
  p_fulfillment       fulfillment_type,
  p_note              text,
  p_contact_name      text,
  p_contact_phone     text,
  p_delivery_address  text default null,
  p_delivery_lat      numeric default null,
  p_delivery_lng      numeric default null,
  p_delivery_barangay text default null,
  p_delivery_landmark text default null,
  p_address_label     text default null,
  p_eta_minutes       int default null
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
    contact_name, contact_phone, delivery_address,
    delivery_lat, delivery_lng, delivery_barangay, delivery_landmark,
    address_label, eta_minutes
  ) values (
    auth.uid(), p_store_id, 'pending', p_fulfillment, coalesce(p_note, ''),
    coalesce(p_contact_name, ''), coalesce(p_contact_phone, ''),
    case when p_fulfillment = 'delivery' then p_delivery_address else null end,
    case when p_fulfillment = 'delivery' then p_delivery_lat else null end,
    case when p_fulfillment = 'delivery' then p_delivery_lng else null end,
    case when p_fulfillment = 'delivery' then p_delivery_barangay else null end,
    case when p_fulfillment = 'delivery' then p_delivery_landmark else null end,
    case when p_fulfillment = 'delivery' then p_address_label else null end,
    p_eta_minutes
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

grant execute on function public.place_order(
  uuid, jsonb, fulfillment_type, text, text, text, text,
  numeric, numeric, text, text, text, int
) to authenticated;
