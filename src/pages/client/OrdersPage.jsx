import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, PageLoader } from '../../components/ui/Feedback'
import { fetchMyOrders } from '../../lib/api'
import { accent, formatDateTime, peso } from '../../lib/constants'

const tabs = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
]

const ACTIVE = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery']

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const visible = orders.filter((o) => {
    if (tab === 'active') return ACTIVE.includes(o.status)
    if (tab === 'completed') return ['completed', 'cancelled'].includes(o.status)
    return true
  })

  if (loading) return <PageLoader label="Loading your orders…" />

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Orders</span>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">My orders</h1>
      </header>

      <div className="mt-6 inline-flex rounded-full border border-ink/10 bg-canvas-2 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === t.key ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {visible.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="No orders here yet"
            description={
              tab === 'active'
                ? 'You have no ongoing orders. Time to grab some pater!'
                : 'Nothing in this section yet.'
            }
            action={
              <Button as={Link} to="/stores">
                Browse stores
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((order) => {
              const a = accent(order.store?.accent)
              const count = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
              return (
                <li key={order.id}>
                  <Link
                    to={`/order/${order.id}`}
                    className="flex flex-col gap-4 rounded-4xl border border-ink/10 p-5 transition hover:border-ink/30 hover:shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className={['grid size-14 shrink-0 place-items-center rounded-3xl text-2xl', a.bg].join(' ')}>
                      {order.store?.hero_emoji ?? '🥟'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold leading-tight">{order.store?.name}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        #{order.reference} · {formatDateTime(order.created_at)} · {count} item
                        {count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <span className="font-display text-lg font-bold tabular-nums">
                        {peso(order.total)}
                      </span>
                      <span className="text-xs font-medium text-ink-muted">
                        {order.fulfillment === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
