-- ============================================================================
--  PASTEL ILIGAN — 004: switch catalog to real Iligan pater shops
--  Run AFTER seed.sql. Safe to re-run.
--
--  Removes the demo pastel stores/products and replaces them with the real
--  pater houses of Iligan City. Categories are retuned for pater.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. REMOVE OLD DEMO CATALOG
-- ---------------------------------------------------------------------------
-- Deleting stores cascades to products. We keep orders intact by not touching
-- order_items.product_id (it is set null on delete).
delete from public.products;                 -- clear menus first
delete from public.stores;                    -- then the demo stores

-- ---------------------------------------------------------------------------
-- 2. CATEGORIES (pater-focused)
-- ---------------------------------------------------------------------------
delete from public.categories;

insert into public.categories (name, slug, emoji, sort_order) values
  ('Classic Pater',  'classic',  '🥟', 1),
  ('Special Pater',  'special',  '🌟', 2),
  ('Packs',          'packs',    '🎉', 3),
  ('Snacks',         'sweet',    '🍢', 4),
  ('Drinks',         'drinks',   '🥤', 5)
on conflict (slug) do update
  set name = excluded.name, emoji = excluded.emoji, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 3. REAL ILIGAN PATER STORES
-- ---------------------------------------------------------------------------
insert into public.stores
  (name, slug, description, address, barangay, phone, accent, lat, lng,
   status, is_open, prep_minutes, delivery_fee, min_order, rating, hero_emoji)
values
  ('Pater Al-Kuwait City Plaza', 'pater-al-kuwait-city-plaza',
   'The original Iligan pater spot at the Public Plaza — beefy, saucy, and best with extra rice.',
   'Public Plaza, Aguinaldo Street', 'Poblacion', '+63 917 701 1309',
   'peach', 8.2280, 124.2452, 'approved', true, 15, 39.00, 80.00, 4.9, '🥟'),

  ('AL Pater Al Kuwait Original — Quezon', 'al-pater-al-kuwait-quezon',
   'Original Al Kuwait recipe along Quezon Avenue Extension. Open late for the after-work crowd.',
   'Quezon Avenue Extension', 'Poblacion', '+63 917 701 1309',
   'mint', 8.2320, 124.2430, 'approved', true, 15, 39.00, 80.00, 4.8, '🥟'),

  ('Tayb Pater', 'tayb-pater',
   'Hearty homemade pater on Lluch Street — generous filling, extra broth on the side.',
   'Lluch Street, Poblacion', 'Poblacion', '',
   'lilac', 8.2275, 124.2460, 'approved', true, 20, 45.00, 80.00, 4.7, '🌟'),

  ('AL Pater Al Kuwait Original — Sanitarium', 'al-pater-al-kuwait-sanitarium',
   'The Sanitarium branch on Tibanga Highway. Same Al Kuwait taste, easy highway pull-in.',
   'Tibanga Highway, Sanitarium', 'Tibanga', '+63 917 701 1309',
   'butter', 8.2190, 124.2380, 'approved', true, 15, 45.00, 80.00, 4.8, '🥟'),

  ('Kitchen 225', 'kitchen-225',
   'Tibanga Highway pater kitchen — broth-forward pater and budget rice meals.',
   '5449 Tibanga Highway', 'Tibanga', '+63 968 567 7071',
   'sky', 8.2185, 124.2375, 'approved', true, 20, 49.00, 100.00, 4.6, '🍲'),

  ('Pater Al-Kuwait — Paseo de Santiago', 'pater-al-kuwait-paseo-de-santiago',
   'Al Kuwait pater at Paseo de Santiago, Balite Drive. Cozy spot for barkada servings.',
   'Balite Drive, Paseo de Santiago', 'Santiago', '+63 917 701 1309',
   'blush', 8.2230, 124.2390, 'approved', true, 20, 45.00, 80.00, 4.7, '🥟');

-- ---------------------------------------------------------------------------
-- 4. PATER MENUS (prices in PHP)
-- ---------------------------------------------------------------------------
with s as (select id, slug from public.stores),
     c as (select id, slug from public.categories)
insert into public.products
  (store_id, category_id, name, description, price, unit, emoji, is_available, is_featured, sort_order)
values
  -- Pater Al-Kuwait City Plaza
  ((select id from s where slug='pater-al-kuwait-city-plaza'), (select id from c where slug='classic'),
   'Beef Pater', 'Slow-cooked beef in a savory broth over seasoned rice.', 80.00, 'order', '🥟', true, true, 1),
  ((select id from s where slug='pater-al-kuwait-city-plaza'), (select id from c where slug='classic'),
   'Chicken Pater', 'Shredded chicken pater, mild and saucy.', 75.00, 'order', '🥟', true, true, 2),
  ((select id from s where slug='pater-al-kuwait-city-plaza'), (select id from c where slug='special'),
   'Special Beef Pater', 'Beef pater with boiled egg and crispy toppings.', 95.00, 'order', '🌟', true, true, 3),
  ((select id from s where slug='pater-al-kuwait-city-plaza'), (select id from c where slug='packs'),
   'Barkada Beef Pater (5 orders)', 'Five beef pater orders for sharing.', 375.00, 'pack', '🎉', true, false, 4),
  ((select id from s where slug='pater-al-kuwait-city-plaza'), (select id from c where slug='drinks'),
   'Sago''t Gulaman', 'Sweet cold sago drink, 16oz.', 35.00, 'cup', '🥤', true, false, 5),

  -- AL Pater Al Kuwait Original — Quezon
  ((select id from s where slug='al-pater-al-kuwait-quezon'), (select id from c where slug='classic'),
   'Original Beef Pater', 'The Al Kuwait Original beef pater, extra broth.', 80.00, 'order', '🥟', true, true, 1),
  ((select id from s where slug='al-pater-al-kuwait-quezon'), (select id from c where slug='classic'),
   'Chicken Pater', 'Saucy chicken pater over rice.', 75.00, 'order', '🥟', true, false, 2),
  ((select id from s where slug='al-pater-al-kuwait-quezon'), (select id from c where slug='special'),
   'Overload Pater', 'Double beef, egg, and toppings.', 110.00, 'order', '🌟', true, true, 3),
  ((select id from s where slug='al-pater-al-kuwait-quezon'), (select id from c where slug='drinks'),
   'Buko Juice', 'Fresh coconut juice, 16oz.', 40.00, 'cup', '🥤', true, false, 4),

  -- Tayb Pater
  ((select id from s where slug='tayb-pater'), (select id from c where slug='classic'),
   'Tayb Beef Pater', 'Generous beef pater with extra broth on the side.', 85.00, 'order', '🥟', true, true, 1),
  ((select id from s where slug='tayb-pater'), (select id from c where slug='classic'),
   'Tayb Chicken Pater', 'Homestyle chicken pater.', 78.00, 'order', '🥟', true, false, 2),
  ((select id from s where slug='tayb-pater'), (select id from c where slug='special'),
   'Tayb Special Pater', 'Beef pater with egg and chili oil.', 98.00, 'order', '🌶️', true, true, 3),
  ((select id from s where slug='tayb-pater'), (select id from c where slug='sweet'),
   'Pater Rice Add-on', 'Extra cup of seasoned rice.', 20.00, 'cup', '🍚', true, false, 4),

  -- AL Pater Al Kuwait Original — Sanitarium
  ((select id from s where slug='al-pater-al-kuwait-sanitarium'), (select id from c where slug='classic'),
   'Original Beef Pater', 'Al Kuwait Original beef pater.', 80.00, 'order', '🥟', true, true, 1),
  ((select id from s where slug='al-pater-al-kuwait-sanitarium'), (select id from c where slug='classic'),
   'Tuna Pater', 'Flaked tuna pater with calamansi.', 78.00, 'order', '🐟', true, false, 2),
  ((select id from s where slug='al-pater-al-kuwait-sanitarium'), (select id from c where slug='special'),
   'Egg Overload Pater', 'Beef pater topped with two eggs.', 100.00, 'order', '🥚', true, true, 3),
  ((select id from s where slug='al-pater-al-kuwait-sanitarium'), (select id from c where slug='drinks'),
   'Softdrinks in Can', 'Chilled, assorted flavors.', 45.00, 'can', '🥤', true, false, 4),

  -- Kitchen 225
  ((select id from s where slug='kitchen-225'), (select id from c where slug='classic'),
   'Kitchen 225 Beef Pater', 'Broth-forward beef pater over rice.', 85.00, 'order', '🥟', true, true, 1),
  ((select id from s where slug='kitchen-225'), (select id from c where slug='special'),
   'Kitchen 225 Special Pater', 'Beef pater with egg, cheese, and crispy garlic.', 105.00, 'order', '🌟', true, true, 2),
  ((select id from s where slug='kitchen-225'), (select id from c where slug='sweet'),
   'Budget Rice Meal', 'Pater-style rice meal on a budget.', 60.00, 'order', '🍚', true, false, 3),
  ((select id from s where slug='kitchen-225'), (select id from c where slug='drinks'),
   'Bottled Water', '500ml, chilled.', 20.00, 'bottle', '💧', true, false, 4),

  -- Pater Al-Kuwait — Paseo de Santiago
  ((select id from s where slug='pater-al-kuwait-paseo-de-santiago'), (select id from c where slug='classic'),
   'Beef Pater', 'Classic Al Kuwait beef pater.', 80.00, 'order', '🥟', true, true, 1),
  ((select id from s where slug='pater-al-kuwait-paseo-de-santiago'), (select id from c where slug='classic'),
   'Chicken Pater', 'Mild chicken pater over seasoned rice.', 75.00, 'order', '🥟', true, false, 2),
  ((select id from s where slug='pater-al-kuwait-paseo-de-santiago'), (select id from c where slug='packs'),
   'Barkada Pater (5 orders)', 'Five pater orders, mixed beef and chicken.', 360.00, 'pack', '🎉', true, true, 3),
  ((select id from s where slug='pater-al-kuwait-paseo-de-santiago'), (select id from c where slug='drinks'),
   'Kape Iligan Brew', 'Local mountain coffee, hot or iced.', 50.00, 'cup', '☕', true, false, 4);

-- ---------------------------------------------------------------------------
-- 5. STORE + PRODUCT PHOTOS (curated free-photo URLs, hotlink-safe)
-- ---------------------------------------------------------------------------
update public.stores set image_url = v.url
from (values
  ('pater-al-kuwait-city-plaza',
   'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=70&auto=format'),
  ('al-pater-al-kuwait-quezon',
   'https://images.unsplash.com/photo-1559847844-5315695dadae?w=900&q=70&auto=format'),
  ('tayb-pater',
   'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=900&q=70&auto=format'),
  ('al-pater-al-kuwait-sanitarium',
   'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=900&q=70&auto=format'),
  ('kitchen-225',
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=70&auto=format'),
  ('pater-al-kuwait-paseo-de-santiago',
   'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=900&q=70&auto=format')
) as v(slug, url)
where public.stores.slug = v.slug;

update public.products set image_url = v.url
from (values
  ('Beef Pater',                    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=70&auto=format'),
  ('Chicken Pater',                 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=70&auto=format'),
  ('Special Beef Pater',            'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=70&auto=format'),
  ('Overload Pater',                'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=70&auto=format'),
  ('Egg Overload Pater',            'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=70&auto=format'),
  ('Tuna Pater',                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=70&auto=format'),
  ('Kitchen 225 Beef Pater',        'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=70&auto=format'),
  ('Kitchen 225 Special Pater',     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=70&auto=format'),
  ('Tayb Beef Pater',               'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=70&auto=format'),
  ('Tayb Chicken Pater',            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=70&auto=format'),
  ('Tayb Special Pater',            'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=70&auto=format'),
  ('Original Beef Pater',           'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&q=70&auto=format'),
  ('Barkada Beef Pater (5 orders)', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=70&auto=format'),
  ('Barkada Pater (5 orders)',      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=70&auto=format'),
  ('Pater Rice Add-on',             'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&q=70&auto=format'),
  ('Budget Rice Meal',              'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&q=70&auto=format'),
  ('Sago''t Gulaman',               'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=70&auto=format'),
  ('Buko Juice',                    'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&q=70&auto=format'),
  ('Softdrinks in Can',             'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=70&auto=format'),
  ('Bottled Water',                 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&q=70&auto=format'),
  ('Kape Iligan Brew',              'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=70&auto=format')
) as v(name, url)
where public.products.name = v.name;
