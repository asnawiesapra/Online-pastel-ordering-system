# Pater Iligan 🥟

A full-stack online ordering system for pater (Iligan City's beloved beef-broth rice dish). Built
with **React + Vite**, **Supabase** (Postgres, Auth, RLS, Realtime) and styled with **Tailwind CSS v4**.

White background, black text, with pastel accent colors per store.

## Roles

| Role       | Can do                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| **Client** | Browse stores & the map, add to cart, checkout (pickup/delivery), track orders live       |
| **Store**  | Manage live order board, CRUD menu, open/close store, edit store settings                 |
| **Admin**  | Approve/suspend stores, view all orders, manage user roles, revenue stats                 |

---

## 1. Prerequisites

- Node.js 18+ (built on Node 24)
- A Supabase project

## 2. Configure environment

`.env` is already created with your project. To point at a different project, copy `.env.example`
to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

## 3. Set up the database (REQUIRED)

Open your Supabase project → **SQL Editor** → **New query**, then run these files **in order**:

1. `supabase/schema.sql` — tables, enums, triggers, the `place_order` helper base
2. `supabase/policies.sql` — Row Level Security policies + the `place_order()` RPC
3. `supabase/seed.sql` — the 6 real Iligan pater houses with menus and prices in ₱
4. `supabase/migrations/001_add_images.sql` — image columns, `images`/`avatars` storage buckets + policies, demo photos
5. `supabase/migrations/002_delivery_coords.sql` — delivery coordinates on orders + updated `place_order()` RPC
6. `supabase/migrations/003_profile_fields.sql` — profile address/barangay/delivery defaults + updated signup trigger
7. `supabase/migrations/004_pater_stores.sql` — replaces any old demo pastel catalog with the pater catalog
8. `supabase/migrations/005_admin_user.sql` — creates the `admin@pater.ph` account (run this instead of signing up)
9. `supabase/migrations/006_store_avatar_notifications.sql` — store profile picture + in-app notifications (table, RLS, realtime, auto-notify triggers)

Each file is idempotent, so you can safely re-run them.

> Alternatively, paste each file's contents into the SQL editor and click **Run**.

## 4. Create your admin account

Run **`supabase/migrations/005_admin_user.sql`** in the SQL editor. It creates (or resets) a ready-to-use
admin account:

```
email:    admin@pater.ph
password: PaterAdmin2026!
```

Edit `v_email` / `v_password` at the top of that file before running if you want different credentials,
then sign in and open **Admin console** from the account menu.

The `handle_new_user` trigger also grants the `admin` role to any account that signs up with
**`admin@pater.ph`** — so signing up with that email works too, as a fallback.

Any other account is created as a **client**. To open a store, a client visits
**/become-a-store** (or an admin can promote them to `store` in **Admin → Users**).

## 5. Run locally

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## 6. Build & preview

```bash
npm run build      # production build into dist/
npm run preview    # preview the production build
npm run lint       # oxlint
```

## 7. Deploy (Vercel)

```bash
npx vercel login
npx vercel --prod
```

Add the two `VITE_*` environment variables in the Vercel project settings. Because this is a
client-side SPA using React Router, add a rewrite so deep links work — create `vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## Project structure

```
src/
  components/
    layout/      Navbar, Footer, CartDrawer, ProtectedRoute
    ui/          Button, Badge, Field, Feedback, QuantityStepper, SmartImage
    store/       StoreCard, ProductCard, IliganMap (illustrated SVG map),
                 AddressPicker (Grab-style delivery pin), DeliveryMap (Leaflet)
  lib/
    supabase.js       Supabase client (reads VITE_ env vars)
    AuthContext.jsx   Session + profile + role
    CartContext.jsx   Persistent cart (localStorage), single-store enforcement
    ToastContext.jsx  Toast notifications
    api.js            All Supabase queries / mutations
    constants.js      Colors, status flow, Iligan barangays, ₱ formatter
    images.js         Curated photo URLs + sizing helpers
    geocode.js        Nominatim search / reverse geocode (OpenStreetMap)
    delivery.js       Haversine distance + ETA
  pages/
    client/      Landing, StoresPage, StoreDetail, MapPage, CartPage,
                 CheckoutPage, OrdersPage, OrderDetail, ProfilePage, NotFound
    auth/        Login, Register, BecomeStore
    store/       StoreDashboard (orders board, menu manager, settings)
    admin/       AdminDashboard (overview, stores, orders, users)
supabase/
  schema.sql     Tables, enums, triggers
  policies.sql   RLS policies + place_order RPC
  seed.sql       Real Iligan pater houses + menus
  migrations/
    001_add_images.sql      Image columns + storage buckets + demo photos
    002_delivery_coords.sql Delivery coordinates + place_order RPC
    003_profile_fields.sql  Profile address/barangay/delivery defaults
    004_pater_stores.sql    Switch catalog to the real pater houses
    005_admin_user.sql      Create the admin account via SQL
    006_store_avatar_notifications.sql  Store profile picture + notifications
```

## Key features

- **Rich profiles** — upload an avatar, set full name and contact number, and save a default
  delivery address (pin-on-map) that prefills checkout.
- **Store profile picture + cover photo** — store owners upload a square profile picture (shown on
  cards, the map, and nav) *and* a wide cover photo for their store page, on top of pin/contact
  settings.
- **My store** — approved store owners get a "My store" link in the account menu that opens their
  public storefront, with a Live/Pending badge.
- **In-app notifications** — a bell in the navbar with an unread count delivers realtime alerts:
  new orders for store owners, status changes for customers, and approval/suspension news for
  owners. Mark one/all as read or clear them (`lib/NotificationsContext.jsx`).
- **Full-color illustrated SVG map** of Iligan City — green land, blue bay with animated waves,
  brown roads with a moving delivery route, compass, elevation hills, and photo pins that highlight
  on hover. No API key, instant load (`components/store/IliganMap.jsx`).
- **Grab-style delivery picker** — drag-to-pin Leaflet + OpenStreetMap map with Nominatim address
  search, barangay/landmark details, Home/Work/Other saved places, and a live ETA
  (`components/store/AddressPicker.jsx`). 100% free, no API key.
- **Real food photos** — curated free-photo URLs with a blur-up `SmartImage` that falls back to the
  store/item emoji if a photo fails to load.
- **Atomic ordering** via the `place_order` Postgres function: totals are calculated server-side,
  so clients can never tamper with prices. Delivery coordinates and ETA are stored on the order.
- **Row Level Security** everywhere: customers only see their own orders, store owners only see
  their own store's orders, admins see everything.
- **Realtime tracking** on the order detail page (Postgres changes subscription), with a drop-off
  mini-map showing the store → customer route.
- **Order status flow**: pending → accepted → preparing → ready → (out for delivery) → completed,
  with a visual progress tracker and automatic status history logging.

## Currency & locale

Prices are in Philippine Peso (₱) formatted with `Intl.NumberFormat('en-PH')`. The storefront is
seeded with Iligan City's real pater houses (Pater Al-Kuwait City Plaza, AL Pater Al Kuwait
Original — Quezon & Sanitarium, Tayb Pater, Kitchen 225, and Paseo de Santiago), and the address
picker covers all 44 barangays (Abuno, Bonbonon, Bunawan, Buru-un, Dalipuga, Hinaplanon, Pala-o,
Poblacion, Suarez, Tambacan, Tibanga, and more).
