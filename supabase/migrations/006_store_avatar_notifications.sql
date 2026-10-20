-- ============================================================================
--  PATER ILIGAN — 006: store avatar + in-app notifications
--  Run AFTER schema.sql, policies.sql and migration 001. Safe to re-run.
--
--  1. stores.avatar_url  — square store profile picture (separate from the
--     wide cover photo stored in stores.image_url).
--  2. notifications      — user-facing notifications with realtime delivery.
--  3. Triggers that auto-create notifications on order + store events.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. STORE PROFILE PICTURE (avatar) SEPARATE FROM COVER (image_url)
-- ---------------------------------------------------------------------------
alter table public.stores add column if not exists avatar_url text;

-- ---------------------------------------------------------------------------
-- 2. NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default extensions.uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null default 'info',
  title       text not null,
  body        text not null default '',
  link        text,
  order_id    uuid references public.orders(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user
  on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (public.is_admin() or user_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid() or public.is_admin());

-- Realtime: broadcast row changes on notifications to subscribers.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 3. AUTO-NOTIFICATIONS
-- ---------------------------------------------------------------------------
-- Helper: insert a notification (security definer so triggers can write past RLS).
create or replace function public.notify_user(
  p_user_id  uuid,
  p_type     text,
  p_title    text,
  p_body     text default '',
  p_link     text default null,
  p_order_id uuid default null,
  p_store_id uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link, order_id, store_id)
  values (p_user_id, coalesce(p_type, 'info'), p_title, coalesce(p_body, ''),
          p_link, p_order_id, p_store_id);
end $$;

-- 3a. New order → notify the store owner.
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_store text;
begin
  select owner_id, name into v_owner, v_store from public.stores where id = new.store_id;
  if v_owner is not null then
    perform public.notify_user(
      v_owner,
      'new_order',
      'New order received',
      v_store || ' has a new ' || new.fulfillment || ' order (' || new.reference || ').',
      '/dashboard',
      new.id,
      new.store_id
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_new_order on public.orders;
create trigger trg_notify_new_order after insert on public.orders
  for each row execute function public.notify_new_order();

-- 3b. Order status change → notify the customer.
create or replace function public.notify_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_store text;
begin
  if new.status = old.status then return new; end if;
  select name into v_store from public.stores where id = new.store_id;
  perform public.notify_user(
    new.customer_id,
    'order_status',
    'Order ' || replace(new.status::text, '_', ' '),
    coalesce(v_store, 'Your store') || ' updated order ' || new.reference || ' to "' ||
      replace(new.status::text, '_', ' ') || '".',
    '/order/' || new.id,
    new.id,
    new.store_id
  );
  return new;
end $$;

drop trigger if exists trg_notify_order_status on public.orders;
create trigger trg_notify_order_status after update on public.orders
  for each row execute function public.notify_order_status();

-- 3c. Store approved/suspended → notify the owner.
create or replace function public.notify_store_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status = old.status then return new; end if;
  if new.status in ('approved', 'suspended') then
    perform public.notify_user(
      new.owner_id,
      'store_status',
      case when new.status = 'approved' then 'Your store is live!' else 'Your store was suspended' end,
      case when new.status = 'approved'
           then new.name || ' is now visible to customers on Pater Iligan.'
           else new.name || ' has been suspended. Contact an admin for details.' end,
      case when new.status = 'approved' then '/store/' || new.slug else '/dashboard' end,
      null,
      new.id
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_store_status on public.stores;
create trigger trg_notify_store_status after update on public.stores
  for each row execute function public.notify_store_status();
