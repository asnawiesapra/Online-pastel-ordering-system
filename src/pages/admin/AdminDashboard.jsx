import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, PageLoader, Spinner } from '../../components/ui/Feedback'
import { Input, Select } from '../../components/ui/Field'
import { adminStats, fetchStores, updateOrderStatus, updateStore } from '../../lib/api'
import { useToast } from '../../lib/ToastContext'
import { supabase } from '../../lib/supabase'
import { accent, formatDateTime, peso } from '../../lib/constants'

function AdminNav() {
  const links = [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/stores', label: 'Stores' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/users', label: 'Users' },
  ]
  return (
    <nav className="inline-flex flex-wrap rounded-full border border-ink/10 bg-canvas-2 p-1">
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
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />
  if (!stats) return null

  const cards = [
    { label: 'Total revenue', value: peso(stats.revenue), tone: 'mint' },
    { label: 'Total orders', value: stats.orderCount, tone: 'sky' },
    { label: 'Stores', value: stats.storeCount, tone: 'peach' },
    { label: 'Pending approvals', value: stats.pendingStores, tone: 'butter' },
    { label: 'Registered users', value: stats.userCount, tone: 'lilac' },
    { label: 'Store owners', value: stats.storeOwners, tone: 'blush' },
  ]

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={['rounded-4xl border border-ink/10 p-6', accent(c.tone).bg].join(' ')}>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoresAdmin() {
  const toast = useToast()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    fetchStores({ includeAll: true })
      .then(setStores)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (store, status) => {
    try {
      await updateStore(store.id, { status })
      toast.success(`${store.name} → ${status}`)
      load()
    } catch (e) {
      toast.error(e.message || 'Could not update store.')
    }
  }

  const visible = filter === 'all' ? stores : stores.filter((s) => s.status === filter)

  const counts = useMemo(
    () => ({
      pending: stores.filter((s) => s.status === 'pending').length,
      approved: stores.filter((s) => s.status === 'approved').length,
      suspended: stores.filter((s) => s.status === 'suspended').length,
    }),
    [stores],
  )

  return (
    <div className="mt-8">
      <div className="inline-flex flex-wrap rounded-full border border-ink/10 bg-canvas-2 p-1">
        {[
          { key: 'all', label: `All (${stores.length})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'approved', label: `Approved (${counts.approved})` },
          { key: 'suspended', label: `Suspended (${counts.suspended})` },
        ].map((t) => (
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

      {loading ? (
        <div className="mt-6 grid place-items-center py-16"><Spinner /></div>
      ) : visible.length === 0 ? (
        <div className="mt-6"><EmptyState emoji="🏪" title="No stores here" /></div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((store) => (
            <li key={store.id} className="flex flex-wrap items-center gap-4 rounded-4xl border border-ink/10 p-5">
              <span className={['grid size-14 shrink-0 place-items-center rounded-3xl text-2xl', accent(store.accent).bg].join(' ')}>
                {store.hero_emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold leading-tight">{store.name}</p>
                  <Badge
                    tone={
                      store.status === 'approved' ? 'mint' : store.status === 'pending' ? 'butter' : 'blush'
                    }
                  >
                    {store.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Brgy. {store.barangay} · ⭐ {store.rating} · {store.owner_id ? 'Has owner' : 'No owner'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {store.status !== 'approved' && (
                  <Button size="sm" onClick={() => setStatus(store, 'approved')}>
                    Approve
                  </Button>
                )}
                {store.status !== 'suspended' && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(store, 'suspended')}>
                    Suspend
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrdersAdmin() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(() => {
    supabase
      .from('orders')
      .select('*, store:stores(name, accent, hero_emoji), customer:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) console.error(error)
        setOrders(data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (order, status) => {
    try {
      await updateOrderStatus(order.id, status)
      toast.success('Order updated.')
      load()
    } catch (e) {
      toast.error(e.message || 'Could not update.')
    }
  }

  const visible = filter ? orders.filter((o) => o.status === filter) : orders

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56">
          <option value="">All statuses</option>
          {['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </Select>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="mt-6 grid place-items-center py-16"><Spinner /></div>
      ) : visible.length === 0 ? (
        <div className="mt-6"><EmptyState emoji="🧾" title="No orders" /></div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((order) => (
            <li key={order.id} className="rounded-4xl border border-ink/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={['grid size-10 place-items-center rounded-2xl text-lg', accent(order.store?.accent).bg].join(' ')}>
                    {order.store?.hero_emoji}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">#{order.reference}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-ink-muted">
                      {order.store?.name} · {order.customer?.full_name || order.contact_name} ·{' '}
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold tabular-nums">{peso(order.total)}</span>
                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => setStatus(order, 'cancelled')}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function UsersAdmin() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setUsers(data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setRole = async (profile, role) => {
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', profile.id)
      if (error) throw error
      toast.success(`${profile.full_name || profile.email} → ${role}`)
      load()
    } catch (e) {
      toast.error(e.message || 'Could not update role.')
    }
  }

  const visible = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  return (
    <div className="mt-8">
      <Input label="Search users" placeholder="Name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <div className="mt-6 grid place-items-center py-16"><Spinner /></div>
      ) : visible.length === 0 ? (
        <div className="mt-6"><EmptyState emoji="👤" title="No users found" /></div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 rounded-4xl border border-ink/10 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-canvas-2 text-lg">👤</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{u.full_name || '—'}</p>
                <p className="truncate text-xs text-ink-muted">{u.email}</p>
              </div>
              <Badge tone={u.role === 'admin' ? 'ink' : u.role === 'store' ? 'lilac' : 'neutral'}>
                {u.role}
              </Badge>
              <Select
                value={u.role}
                onChange={(e) => setRole(u, e.target.value)}
                className="w-36"
              >
                <option value="client">client</option>
                <option value="store">store</option>
                <option value="admin">admin</option>
              </Select>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Admin</span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Console</h1>
        </div>
        <AdminNav />
      </div>

      <Routes>
        <Route index element={<Overview />} />
        <Route path="stores" element={<StoresAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="users" element={<UsersAdmin />} />
      </Routes>
    </div>
  )
}
