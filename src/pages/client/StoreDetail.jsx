import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DeliveryMap } from '../../components/store/DeliveryMap'
import { ProductCard } from '../../components/store/ProductCard'
import { StoreCard } from '../../components/store/StoreCard'
import { StoreAvatar } from '../../components/store/StoreAvatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, PageLoader } from '../../components/ui/Feedback'
import { fetchStoreBySlug, fetchStoreMenu, fetchStores } from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import { useCart } from '../../lib/CartContext'
import { useToast } from '../../lib/ToastContext'
import { accent, peso } from '../../lib/constants'
import { sizedImage } from '../../lib/images'

export default function StoreDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem, setQuantity, cart, itemCount, subtotal } = useCart()
  const toast = useToast()

  const [store, setStore] = useState(null)
  const [menu, setMenu] = useState([])
  const [others, setOthers] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    setStore(null)
    setCategory('all')

    fetchStoreBySlug(slug)
      .then(async (s) => {
        if (!active) return
        if (!s) {
          setLoading(false)
          return
        }
        setStore(s)
        const [m, all] = await Promise.all([fetchStoreMenu(s.id), fetchStores()])
        if (!active) return
        setMenu(m)
        setOthers(all.filter((x) => x.id !== s.id).slice(0, 3))
      })
      .catch((e) => console.error(e))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [slug])

  const categories = useMemo(() => {
    const map = new Map()
    menu.forEach((p) => {
      if (p.category) map.set(p.category.slug, p.category)
    })
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order)
  }, [menu])

  const visibleMenu = useMemo(
    () => (category === 'all' ? menu : menu.filter((p) => p.category?.slug === category)),
    [menu, category],
  )

  const inThisStore = cart?.storeId === store?.id
  const qtyOf = (productId) =>
    inThisStore ? cart.items.find((i) => i.productId === productId)?.quantity ?? 0 : 0

  const handleAdd = (product) => {
    if (!store.is_open) {
      toast.error('This store is currently closed.')
      return
    }
    const switching = cart && cart.storeId !== store.id && itemCount > 0
    addItem(store, product, 1)
    if (switching) {
      toast.info(`Basket reset to ${store.name}.`)
    } else {
      toast.success(`${product.name} added to basket.`)
    }
  }

  const goToCheckout = () => {
    if (!user) {
      toast.info('Sign in to check out.')
      navigate('/login', { state: { from: `/store/${slug}` } })
      return
    }
    navigate('/checkout')
  }

  if (loading) return <PageLoader label="Loading store…" />

  if (!store) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          emoji="🧭"
          title="Store not found"
          description="This store may have been removed or is not yet approved."
          action={
            <Button as={Link} to="/stores">
              Back to stores
            </Button>
          }
        />
      </div>
    )
  }

  const a = accent(store.accent)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-2 text-sm text-ink-muted">
        <Link to="/stores" className="hover:text-ink">
          Stores
        </Link>
        <span>/</span>
        <span className="text-ink">{store.name}</span>
      </nav>

      <header className={['mt-5 overflow-hidden rounded-5xl border border-ink/10', a.bg].join(' ')}>
        {sizedImage(store.image_url, 'hero') && (
          <div className="relative h-44 w-full overflow-hidden sm:h-56">
            <img
              src={sizedImage(store.image_url, 'hero')}
              alt={store.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.closest('div').style.display = 'none'
              }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <StoreAvatar store={store} size="2xl" rounded="4xl" className="bg-white shadow-sm" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">{store.name}</h1>
                <Badge tone={store.is_open ? 'mint' : 'blush'}>
                  {store.is_open ? 'Open now' : 'Closed'}
                </Badge>
              </div>
              <p className="mt-2 max-w-xl text-sm text-ink-soft">{store.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-white/70 px-2.5 py-1">⭐ {store.rating}</span>
                <span className="rounded-full bg-white/70 px-2.5 py-1">Brgy. {store.barangay}</span>
                <span className="rounded-full bg-white/70 px-2.5 py-1">~{store.prep_minutes} min prep</span>
                <span className="rounded-full bg-white/70 px-2.5 py-1">
                  Delivery {peso(store.delivery_fee)}
                </span>
              </div>
            </div>
          </div>

          {itemCount > 0 && inThisStore && (
            <div className="flex shrink-0 items-center gap-3 rounded-4xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs text-ink-muted">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
                <p className="font-display text-xl font-bold">{peso(subtotal)}</p>
              </div>
              <Button onClick={goToCheckout}>Checkout</Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-black/5 px-6 py-3 text-xs text-ink-soft sm:px-8">
          <span>📍 {store.address}</span>
          {store.phone && <span>📞 {store.phone}</span>}
          {store.min_order > 0 && <span>🧾 Min. order {peso(store.min_order)}</span>}
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={[
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
                category === 'all'
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/15 bg-white hover:border-ink/40',
              ].join(' ')}
            >
              All items
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={[
                  'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
                  category === c.slug
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink/15 bg-white hover:border-ink/40',
                ].join(' ')}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {visibleMenu.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                store={store}
                quantity={qtyOf(product.id)}
                onAdd={handleAdd}
                onQuantityChange={(q) => setQuantity(product.id, q)}
              />
            ))}
          </div>

          {visibleMenu.length === 0 && (
            <div className="mt-6">
              <EmptyState emoji="🍽️" title="No items in this category" />
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-80">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-4xl border border-ink/10 p-5">
              <h3 className="font-display text-lg font-bold tracking-tight">Store info</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Barangay</dt>
                  <dd className="text-right font-medium">{store.barangay}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Prep time</dt>
                  <dd className="text-right font-medium">~{store.prep_minutes} min</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Delivery fee</dt>
                  <dd className="text-right font-medium">{peso(store.delivery_fee)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Minimum</dt>
                  <dd className="text-right font-medium">{peso(store.min_order)}</dd>
                </div>
              </dl>
              {store.lat && store.lng && (
                <div className="mt-4">
                  <DeliveryMap store={store} height={180} />
                  <p className="mt-2 text-center text-xs text-ink-muted">
                    {store.address}, Brgy. {store.barangay}
                  </p>
                </div>
              )}
            </div>

            {others.length > 0 && (
              <div>
                <h3 className="mb-3 font-display text-lg font-bold tracking-tight">More stores</h3>
                <div className="space-y-3">
                  {others.map((s) => (
                    <StoreCard key={s.id} store={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
