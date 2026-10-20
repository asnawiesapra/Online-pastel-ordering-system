-- ============================================================================
--  PASTEL ILIGAN — 003: richer profiles (address, delivery defaults)
--  Run AFTER 001_add_images.sql. Safe to re-run.
--  (avatar_url is added by 001_add_images.sql)
-- ============================================================================

alter table public.profiles add column if not exists address        text;
alter table public.profiles add column if not exists address_label  text;
alter table public.profiles add column if not exists delivery_lat   numeric(9,6);
alter table public.profiles add column if not exists delivery_lng   numeric(9,6);
alter table public.profiles add column if not exists barangay       text;

-- Keep the signup trigger in sync with the new profile shape.
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

  if lower(new.email) = 'admin@pastel.ph' then
    v_role := 'admin';
  elsif (new.raw_user_meta_data->>'role') = 'store' then
    v_role := 'store';
  end if;

  insert into public.profiles (id, email, full_name, phone, role, avatar_seed, address, barangay)
  values (
    new.id,
    new.email,
    v_name,
    new.raw_user_meta_data->>'phone',
    v_role,
    substr(md5(new.id::text), 1, 6),
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'barangay'
  )
  on conflict (id) do nothing;

  return new;
end $$;
