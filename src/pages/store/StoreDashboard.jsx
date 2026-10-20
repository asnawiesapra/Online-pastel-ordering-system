import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AddressPicker } from '../../components/store/AddressPicker'
import { DeliveryMap } from '../../components/store/DeliveryMap'
import { StoreAvatar } from '../../components/store/StoreAvatar'
import { SmartImage } from '../../components/ui/SmartImage'
import { ImageUploadField } from '../../components/ui/ImageUploadField'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { EmptyState, PageLoader, Spinner } from '../../components/ui/Feedback'
import {
  createStore,
  deleteProduct,
  fetchMyStore,
  fetchStoreMenu,
  fetchStoreOrders,
  fetchStores,
  updateOrderStatus,
  updateStore,
  upsertProduct,
} from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import { useToast } from '../../lib/ToastContext'
import {
  ACCENT_KEYS,
  accent,
  formatDateTime,
  ILIGAN_BARANGAYS,
  nextStatuses,
  ORDER_STATUS,
  peso,
  slugify,
} from '../../lib/constants'
import { sizedImage } from '../../lib/images'

function StoreNav({ store, owner }) {
  const links = [
    { to: '/dashboard', label: 'Orders', end: true },
    { to: '/dashboard/menu', label: 'Menu' },
    { to: '/dashboard/settings', label: 'Settings' },
  ]
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <StoreAvatar store={store} size="md" className="border border-ink/10" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{store?.name ?? 'Store'}</h1>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            {owner?.avatar_url ? (
              <img src={owner.avatar_url} alt="" className="size-4 rounded-full object-cover" />
            ) : null}
            {owner?.full_name ? `${owner.full_name} · ` : ''}
            {store?.status === 'approved' ? 'Live on the storefront' : 'Awaiting admin approval'}
          </p>
        </div>
      </div>
      <nav className="inline-flex rounded-full border border-ink/10 bg-canvas-2 p-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              [
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                isActive ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink',
              ].join(' ')
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function OrdersBoard({ store, onStoreChange }) {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  const load = useCallback(() => {
    fetchStoreOrders(store.id)
      .then(setOrders)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [store.id])

  useEffect(() => {
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  const advance = async (order, status) => {
    try {
      await updateOrderStatus(order.id, status)
      toast.success(`Order ${order.reference} → ${ORDER_STATUS[status].label}`)
      load()
    } catch (e) {
      toast.error(e.message || 'Could not update order.')
    }
  }

  const toggleOpen = async () => {
    try {
      const updated = await updateStore(store.id, { is_open: !store.is_open })
      onStoreChange(updated)
      toast.success(updated.is_open ? 'Store is now open.' : 'Store is now closed.')
    } catch (e) {
      toast.error(e.message || 'Could not update store.')
    }
  }

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, completed: 0 }
    orders.forEach((o) => {
      if (o.status === 'pending') c.pending += 1
      if (['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)) c.active += 1
      if (o.status === 'completed') c.completed += 1
    })
    return c
  }, [orders])

  const visible = orders.filter((o) => {
    if (filter === 'active') return ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
    if (filter === 'completed') return o.status === 'completed'
    if (filter === 'cancelled') return o.status === 'cancelled'
    return true
  })

  const tabs = [
    { key: 'active', label: `Active (${counts.pending + counts.active})` },
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'New', value: counts.pending, tone: 'butter' },
          { label: 'In progress', value: counts.active, tone: 'lilac' },
          { label: 'Completed', value: counts.completed, tone: 'mint' },
        ].map((s) => (
          <div key={s.label} className={['rounded-3xl border border-ink/10 p-4', accent(s.tone).bg].join(' ')}>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-full border border-ink/10 bg-canvas-2 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={[
                'rounded-full px-3.5 py-2 text-sm font-semibold transition',
                filter === t.key ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button variant={store.is_open ? 'outline' : 'primary'} size="sm" onClick={toggleOpen}>
          {store.is_open ? '⏸ Close store' : '▶ Open store'}
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 grid place-items-center py-16">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState emoji="🧾" title="No orders in this view" />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((order) => {
            const next = nextStatuses(order.status, order.fulfillment)
            return (
              <li key={order.id} className="rounded-4xl border border-ink/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">#{order.reference}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs font-medium text-ink-muted">
                        {order.fulfillment === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{formatDateTime(order.created_at)}</p>
                  </div>
                  <p className="font-display text-xl font-bold tabular-nums">{peso(order.total)}</p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Items</p>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {order.items?.map((i) => (
                        <li key={i.id} className="flex justify-between gap-2">
                          <span>{i.quantity}× {i.product_name}</span>
                          <span className="text-ink-muted tabular-nums">{peso(i.line_total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Customer</p>
                    <p className="mt-1.5 text-sm font-medium">{order.contact_name || order.customer?.full_name}</p>
                    <p className="text-sm text-ink-muted">{order.contact_phone || order.customer?.phone}</p>
                    {order.fulfillment === 'delivery' && order.delivery_address && (
                      <p className="mt-1 text-sm text-ink-soft">
                        📍 {order.address_label ? `${order.address_label}: ` : ''}
                        {order.delivery_address}
                      </p>
                    )}
                    {order.eta_minutes && (
                      <span className="mt-1 inline-block rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                        ETA ~{order.eta_minutes} min
                      </span>
                    )}
                    {order.note && (
                      <p className="mt-1 rounded-xl bg-canvas-2 px-2 py-1 text-xs text-ink-soft">
                        Note: {order.note}
                      </p>
                    )}
                  </div>
                </div>

                {order.fulfillment === 'delivery' && order.delivery_lat && (
                  <div className="mt-3">
                    <DeliveryMap
                      store={store}
                      point={{
                        lat: Number(order.delivery_lat),
                        lng: Number(order.delivery_lng),
                        label: order.delivery_address,
                      }}
                      height={190}
                    />
                  </div>
                )}

                {next.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/8 pt-4">
                    {next.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === 'cancelled' ? 'outline' : 'primary'}
                        onClick={() => advance(order, status)}
                        className={status === 'cancelled' ? 'text-red-600' : ''}
                      >
                        {status === 'cancelled' ? 'Cancel order' : `Mark ${ORDER_STATUS[status].label}`}
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function MenuManager({ store }) {
  const toast = useToast()
  const { uploadImage } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const load = useCallback(() => {
    fetchStoreMenu(store.id)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [store.id])

  useEffect(() => {
    load()
  }, [load])

  const blank = {
    id: undefined,
    store_id: store.id,
    name: '',
    description: '',
    price: 0,
    unit: 'pc',
    emoji: '🥟',
    image_url: '',
    is_available: true,
    is_featured: false,
  }

  const save = async (e) => {
    e.preventDefault()
    if (!editing.name.trim()) {
      toast.error('Item name is required.')
      return
    }
    try {
      await upsertProduct({
        ...editing,
        store_id: store.id,
        price: Number(editing.price) || 0,
        image_url: editing.image_url?.trim() ? editing.image_url.trim() : null,
      })
      toast.success('Menu saved.')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save item.')
    }
  }

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    try {
      await deleteProduct(product.id)
      toast.info('Item deleted.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete.')
    }
  }

  const toggleAvailable = async (product) => {
    try {
      await upsertProduct({ ...product, is_available: !product.is_available })
      load()
    } catch (err) {
      toast.error(err.message || 'Could not update.')
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-4xl border border-ink/10 p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">
          {editing ? (editing.id ? 'Edit item' : 'New item') : 'Add to menu'}
        </h2>
        <form onSubmit={save} className="mt-4 space-y-4">
          <Input
            label="Name"
            value={editing?.name ?? ''}
            onChange={(e) => setEditing((p) => ({ ...(p ?? blank), name: e.target.value }))}
            placeholder="Beef Pater"
            required
          />
          <Textarea
            label="Description"
            rows={2}
            value={editing?.description ?? ''}
            onChange={(e) => setEditing((p) => ({ ...(p ?? blank), description: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Price ₱"
              type="number"
              min={0}
              step="0.01"
              value={editing?.price ?? 0}
              onChange={(e) => setEditing((p) => ({ ...(p ?? blank), price: e.target.value }))}
            />
            <Input
              label="Unit"
              value={editing?.unit ?? 'pc'}
              onChange={(e) => setEditing((p) => ({ ...(p ?? blank), unit: e.target.value }))}
            />
            <Input
              label="Emoji"
              maxLength={2}
              value={editing?.emoji ?? '🥟'}
              onChange={(e) => setEditing((p) => ({ ...(p ?? blank), emoji: e.target.value }))}
            />
          </div>
          <ImageUploadField
            label="Photo (optional)"
            folder="products"
            aspect="video"
            emoji={editing?.emoji ?? '🥟'}
            value={editing?.image_url ?? ''}
            upload={uploadImage}
            onChange={(url) => setEditing((p) => ({ ...(p ?? blank), image_url: url }))}
          />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={editing?.is_available ?? true}
                onChange={(e) => setEditing((p) => ({ ...(p ?? blank), is_available: e.target.checked }))}
              />
              Available
            </label>
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={editing?.is_featured ?? false}
                onChange={(e) => setEditing((p) => ({ ...(p ?? blank), is_featured: e.target.checked }))}
              />
              Featured
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editing?.id ? 'Save changes' : 'Add item'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Menu <span className="text-sm font-medium text-ink-muted">({products.length})</span>
        </h2>
        {loading ? (
          <div className="mt-6 grid place-items-center py-16">
            <Spinner />
          </div>
        ) : products.length === 0 ? (
          <div className="mt-4">
            <EmptyState emoji="🍽️" title="No items yet" description="Add your first menu item on the left." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {products.map((product) => (
              <li key={product.id} className="flex items-center gap-3 rounded-3xl border border-ink/10 p-4">
                <SmartImage
                  src={sizedImage(product.image_url, 'thumb')}
                  alt={product.name}
                  emoji={product.emoji}
                  accentName={store.accent}
                  ratio="square"
                  className="size-12 shrink-0 rounded-2xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{product.name}</p>
                  <p className="text-xs text-ink-muted">
                    {peso(product.price)} / {product.unit}
                    {product.category?.name ? ` · ${product.category.name}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleAvailable(product)}
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                      product.is_available ? 'bg-mint text-emerald-900' : 'bg-blush text-pink-900',
                    ].join(' ')}
                  >
                    {product.is_available ? 'Available' : 'Sold out'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(product)}
                    className="rounded-full border border-ink/15 px-2.5 py-1 text-xs font-semibold hover:bg-canvas-2"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(product)}
                    className="rounded-full px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StoreSettings({ store, onStoreChange }) {
  const toast = useToast()
  const { uploadImage } = useAuth()
  const [form, setForm] = useState(store)
  const [pin, setPin] = useState(store.lat && store.lng ? { lat: Number(store.lat), lng: Number(store.lng) } : null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(store)
    setPin(store.lat && store.lng ? { lat: Number(store.lat), lng: Number(store.lng) } : null)
  }, [store])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateStore(store.id, {
        name: form.name,
        description: form.description,
        address: form.address,
        barangay: form.barangay,
        phone: form.phone,
        accent: form.accent,
        hero_emoji: form.hero_emoji,
        image_url: form.image_url?.trim() ? form.image_url.trim() : null,
        avatar_url: form.avatar_url?.trim() ? form.avatar_url.trim() : null,
        prep_minutes: Number(form.prep_minutes) || 20,
        delivery_fee: Number(form.delivery_fee) || 0,
        min_order: Number(form.min_order) || 0,
        lat: pin?.lat ?? form.lat,
        lng: pin?.lng ?? form.lng,
      })
      onStoreChange(updated)
      toast.success('Store updated.')
    } catch (err) {
      toast.error(err.message || 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="mt-8 max-w-2xl space-y-4 rounded-4xl border border-ink/10 p-6">
      <h2 className="font-display text-lg font-bold tracking-tight">Store settings</h2>
      <Input label="Store name" value={form.name ?? ''} onChange={set('name')} required />
      <Textarea label="Description" rows={3} value={form.description ?? ''} onChange={set('description')} />

      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
        <ImageUploadField
          label="Profile picture"
          folder="store-avatars"
          aspect="square"
          round
          emoji={form.hero_emoji ?? '🏪'}
          value={form.avatar_url ?? ''}
          upload={uploadImage}
          hint="Shown on cards, the map & nav."
          onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
        />
        <ImageUploadField
          label="Cover photo"
          folder="stores"
          aspect="video"
          emoji={form.hero_emoji ?? '🏪'}
          value={form.image_url ?? ''}
          upload={uploadImage}
          hint="Wide banner on your store page."
          onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold tracking-tight">Store pin</span>
        {pin ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-white p-4">
            <span className="flex items-center gap-3 text-sm">
              <span className="grid size-9 place-items-center rounded-xl bg-sky text-lg">📍</span>
              <span className="text-ink-muted">
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="text-xs font-bold text-ink-muted underline hover:text-ink"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-4 text-left transition hover:border-ink/40"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-canvas-2 text-lg">📍</span>
              <span className="text-sm font-bold">Drop your store pin</span>
            </span>
            <span className="text-ink-muted">→</span>
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Address" value={form.address ?? ''} onChange={set('address')} />
        <Select label="Barangay" value={form.barangay ?? 'Poblacion'} onChange={set('barangay')}>
          {ILIGAN_BARANGAYS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Contact" value={form.phone ?? ''} onChange={set('phone')} />
        <Input label="Store emoji" maxLength={2} value={form.hero_emoji ?? '🥟'} onChange={set('hero_emoji')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Prep (min)" type="number" value={form.prep_minutes ?? 20} onChange={set('prep_minutes')} />
        <Input label="Delivery fee ₱" type="number" value={form.delivery_fee ?? 0} onChange={set('delivery_fee')} />
        <Input label="Min order ₱" type="number" value={form.min_order ?? 0} onChange={set('min_order')} />
      </div>
      <div>
        <span className="mb-2 block text-sm font-semibold">Accent</span>
        <div className="flex flex-wrap gap-2">
          {ACCENT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm((f) => ({ ...f, accent: key }))}
              aria-label={key}
              className={['size-10 rounded-2xl border-2 transition', form.accent === key ? 'border-ink' : 'border-transparent'].join(' ')}
              style={{
                backgroundColor: {
                  mint: '#cdeee0', peach: '#ffe0d1', lilac: '#e4dcfb',
                  butter: '#fdf0c4', blush: '#fcdce6', sky: '#d6ecfb',
                }[key],
              }}
            />
          ))}
        </div>
      </div>
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>

      <AddressPicker
        open={pickerOpen}
        initial={pin}
        onClose={() => setPickerOpen(false)}
        onConfirm={(picked) => {
          setPin({ lat: picked.lat, lng: picked.lng })
          if (picked.line) setForm((f) => ({ ...f, address: picked.line }))
          if (picked.barangay) setForm((f) => ({ ...f, barangay: picked.barangay }))
          setPickerOpen(false)
        }}
      />
    </form>
  )
}

function SetupStore({ userId, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', barangay: 'Poblacion', address: '', description: '' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const created = await createStore({
        owner_id: userId,
        name: form.name,
        slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`,
        description: form.description,
        address: form.address,
        barangay: form.barangay,
        accent: 'mint',
        status: 'pending',
      })
      toast.success('Store created — pending admin approval.')
      onCreated(created)
    } catch (err) {
      toast.error(err.message || 'Could not create store.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-16">
      <h1 className="font-display text-2xl font-bold tracking-tight">Set up your store</h1>
      <p className="mt-2 text-sm text-ink-muted">
        You&apos;re signed in as a store owner but don&apos;t have a store yet.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-4xl border border-ink/10 p-6">
        <Input label="Store name" value={form.name} onChange={set('name')} required />
        <Select label="Barangay" value={form.barangay} onChange={set('barangay')}>
          {ILIGAN_BARANGAYS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </Select>
        <Input label="Address" value={form.address} onChange={set('address')} />
        <Textarea label="Description" rows={2} value={form.description} onChange={set('description')} />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create store'}
        </Button>
      </form>
    </div>
  )
}

export default function StoreDashboard() {
  const { user, profile, setMyStore } = useAuth()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)

  const applyStore = useCallback(
    (s) => {
      setStore(s)
      setMyStore(s ?? null)
    },
    [setMyStore],
  )

  useEffect(() => {
    if (!user) return
    fetchMyStore(user.id)
      .then((s) => {
        if (!s) {
          return fetchStores({ includeAll: true }).then((all) => {
            const owned = all.find((x) => x.owner_id === user.id)
            applyStore(owned ?? null)
          })
        }
        applyStore(s)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [user, applyStore])

  if (loading) return <PageLoader label="Loading your store…" />
  if (!store) return <SetupStore userId={user.id} onCreated={applyStore} />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <StoreNav store={store} owner={profile} />
      {store.status !== 'approved' && (
        <div className="mt-6 rounded-3xl bg-butter px-5 py-4 text-sm font-medium text-yellow-900">
          Your store is <strong>pending approval</strong>. You can prep your menu now — it goes live
          once an admin approves it.
        </div>
      )}
      <Routes>
        <Route index element={<OrdersBoard store={store} onStoreChange={applyStore} />} />
        <Route path="menu" element={<MenuManager store={store} />} />
        <Route path="settings" element={<StoreSettings store={store} onStoreChange={applyStore} />} />
      </Routes>
    </div>
  )
}
