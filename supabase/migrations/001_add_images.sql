-- ============================================================================
--  PASTEL ILIGAN — 001: image columns + storage buckets + photo seed
--  Run AFTER schema.sql and policies.sql. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. IMAGE COLUMNS
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.products add column if not exists image_url  text;
alter table public.stores   add column if not exists image_url  text;

-- ---------------------------------------------------------------------------
-- 2. STORAGE BUCKETS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images',  'images',  true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('avatars', 'avatars', true, 2097152,
   array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3. STORAGE POLICIES
-- ---------------------------------------------------------------------------
drop policy if exists "images public read"  on storage.objects;
create policy "images public read" on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists "images auth insert" on storage.objects;
create policy "images auth insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and owner = auth.uid());

drop policy if exists "images auth update" on storage.objects;
create policy "images auth update" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'images' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "images auth delete" on storage.objects;
create policy "images auth delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "avatars public read"  on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars self insert" on storage.objects;
create policy "avatars self insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "avatars self update" on storage.objects;
create policy "avatars self update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'avatars' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "avatars self delete" on storage.objects;
create policy "avatars self delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (owner = auth.uid() or public.is_admin()));

-- ---------------------------------------------------------------------------
-- 4. SEED STORE + PRODUCT PHOTOS (curated free-photo URLs, hotlink-safe)
-- ---------------------------------------------------------------------------
update public.stores set image_url = v.url
from (values
  ('pastel-ni-nanay-rosa',    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=70&auto=format'),
  ('tita-nenas-pastel-house', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=900&q=70&auto=format'),
  ('pastel-sa-suarez',        'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=900&q=70&auto=format'),
  ('del-carmen-bakehouse',    'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?w=900&q=70&auto=format'),
  ('palao-pastel-corner',     'https://images.unsplash.com/photo-1600847393248-9c9f1c0f5a2c?w=900&q=70&auto=format'),
  ('tambacan-sweet-savory',   'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=900&q=70&auto=format'),
  ('hinaplanon-home-kitchen', 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=900&q=70&auto=format'),
  ('san-miguel-pastel',       'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?w=900&q=70&auto=format')
) as v(slug, url)
where public.stores.slug = v.slug;

update public.products set image_url = v.url
from (values
  ('Classic Pastel (Pork)',   'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=70&auto=format'),
  ('Classic Pastel (Beef)',   'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=600&q=70&auto=format'),
  ('Cheesy Pastel',           'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=70&auto=format'),
  ('Spicy Chicken Pastel',    'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=600&q=70&auto=format'),
  ('Barkada Pack (10 pcs)',   'https://images.unsplash.com/photo-1600847393248-9c9f1c0f5a2c?w=600&q=70&auto=format'),
  ('Sago''t Gulaman',         'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=70&auto=format'),
  ('Tita Nena Classic',       'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?w=600&q=70&auto=format'),
  ('Ilonggo Spicy Pastel',    'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=600&q=70&auto=format'),
  ('Tuna Pastel',             'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=600&q=70&auto=format'),
  ('Leche Flan Slice',        'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?w=600&q=70&auto=format'),
  ('Buko Juice',              'https://images.pexels.com/photos/1291200/pexels-photo-1291200.jpeg?w=600&q=70&auto=format'),
  ('Suarez Homestyle Pastel', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=70&auto=format'),
  ('Pasalubong Box (12 pcs)', 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=600&q=70&auto=format'),
  ('Bibingka Cup',            'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=70&auto=format'),
  ('Kape Iligan Brew',        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=70&auto=format'),
  ('Bakehouse Pastel',        'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&q=70&auto=format'),
  ('Pan de Coco (3 pcs)',     'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?w=600&q=70&auto=format'),
  ('Ensaymada',               'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=70&auto=format'),
  ('Ube Pastel',              'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?w=600&q=70&auto=format'),
  ('Kapeng Barako',           'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=600&q=70&auto=format'),
  ('Highway Pastel',          'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?w=600&q=70&auto=format'),
  ('Double Egg Pastel',       'https://images.unsplash.com/photo-1600847393248-9c9f1c0f5a2c?w=600&q=70&auto=format'),
  ('Driver''s Pack (6 pcs)',  'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=600&q=70&auto=format'),
  ('Softdrinks in Can',       'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=70&auto=format'),
  ('Tambacan Classic',        'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=600&q=70&auto=format'),
  ('Seafood Pastel',          'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=600&q=70&auto=format'),
  ('Weekend Sapin-Sapin',     'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=70&auto=format'),
  ('Family Tray (20 pcs)',    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=70&auto=format'),
  ('Hinaplanon Classic',      'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&q=70&auto=format'),
  ('Corned Beef Pastel',      'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=600&q=70&auto=format'),
  ('Banana Turon',            'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?w=600&q=70&auto=format'),
  ('Sari-Sari Pastel',        'https://images.unsplash.com/photo-1600847393248-9c9f1c0f5a2c?w=600&q=70&auto=format'),
  ('Snack Pack (5 pcs)',      'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?w=600&q=70&auto=format'),
  ('Bottled Water',           'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?w=600&q=70&auto=format')
) as v(name, url)
where public.products.name = v.name;
