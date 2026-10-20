-- ============================================================================
--  PATER ILIGAN — demo seed data
--  Run AFTER schema.sql and policies.sql. Safe to re-run.
--
--  Seeds the real pater houses of Iligan City (owner_id = null). Attach a
--  real owner later from the admin dashboard once that person has signed up.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, emoji, sort_order) values
  ('Classic Pater',  'classic',  '🥟', 1),
  ('Special Pater',  'special',  '🌟', 2),
  ('Packs',          'packs',    '🎉', 3),
  ('Snacks',         'sweet',    '🍢', 4),
  ('Drinks',         'drinks',   '🥤', 5)
on conflict (slug) do update
  set name = excluded.name, emoji = excluded.emoji, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- STORES  (real Iligan City pater houses; coordinates are approximations)
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
   'blush', 8.2230, 124.2390, 'approved', true, 20, 45.00, 80.00, 4.7, '🥟')
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      address     = excluded.address,
      barangay    = excluded.barangay,
      phone       = excluded.phone,
      accent      = excluded.accent,
      lat         = excluded.lat,
      lng         = excluded.lng,
      status      = excluded.status,
      is_open     = excluded.is_open,
      prep_minutes= excluded.prep_minutes,
      delivery_fee= excluded.delivery_fee,
      min_order   = excluded.min_order,
      rating      = excluded.rating,
      hero_emoji  = excluded.hero_emoji;

-- ---------------------------------------------------------------------------
-- PRODUCTS  (prices in PHP)
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
   'Kape Iligan Brew', 'Local mountain coffee, hot or iced.', 50.00, 'cup', '☕', true, false, 4)
;
