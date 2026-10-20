import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DeliveryMap } from '../../components/store/DeliveryMap'
import { StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, PageLoader } from '../../components/ui/Feedback'
import { cancelOrder, fetchOrder } from '../../lib/api'
import { useToast } from '../../lib/ToastContext'
import { supabase } from '../../lib/supabase'
import {
  accent,
  formatDateTime,
  ORDER_STATUS,
  peso,
  STATUS_FLOW,
} from '../../lib/constants'

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    return fetchOrder(id)
      .then(setOrder)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => {
          load()
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${id}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, load])

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return
    try {
      await cancelOrder(order.id, 'Cancelled by customer')
      toast.info('Order cancelled.')
      load()
    } catch (e) {
      toast.error(e.message || 'Could not cancel.')
    }
  }

  if (loading) return <PageLoader label="Loading order…" />

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          emoji="🧾"
          title="Order not found"
          description="This order may have been removed, or you don't have access to it."
          action={
            <Button as={Link} to="/orders">
              My orders
            </Button>
          }
        />
      </div>
    )
  }

  const a = accent(order.store?.accent)
  const canCancel = ['pending', 'accepted'].includes(order.status)
  const cancelled = order.status === 'cancelled'
  const currentStep = ORDER_STATUS[order.status]?.step ?? 0
  const timeline = order.fulfillment === 'delivery'
    ? STATUS_FLOW
    : STATUS_FLOW.filter((s) => s !== 'out_for_delivery')

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-2 text-sm text-ink-muted">
        <Link to="/orders" className="hover:text-ink">
          My orders
        </Link>
        <span>/</span>
        <span className="text-ink">#{order.reference}</span>
      </nav>

      <header className={['mt-5 rounded-5xl border border-ink/10 p-6 sm:p-8', a.bg].join(' ')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-16 place-items-center rounded-4xl bg-white text-3xl shadow-sm">
              {order.store?.hero_emoji}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Order #{order.reference}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                {order.store?.name}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">{formatDateTime(order.created_at)}</p>
            </div>
          </div>
          <StatusBadge status={order.status} className="bg-white/70" />
        </div>

        <p className="mt-4 text-sm font-medium text-ink-soft">
          {ORDER_STATUS[order.status]?.hint}
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Progress tracker */}
          {!cancelled && (
            <section className="rounded-4xl border border-ink/10 p-6">
              <h2 className="font-display text-lg font-bold tracking-tight">Order progress</h2>
              <ol className="mt-5 space-y-0">
                {timeline.map((status, index) => {
                  const step = ORDER_STATUS[status].step
                  const done = currentStep >= step
                  const isCurrent = order.status === status
                  return (
                    <li key={status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={[
                            'grid size-8 place-items-center rounded-full text-xs font-bold transition',
                            done ? 'bg-ink text-white' : 'border border-ink/20 bg-white text-ink-muted',
                          ].join(' ')}
                        >
                          {done ? '✓' : index + 1}
                        </span>
                        {index < timeline.length - 1 && (
                          <span
                            className={[
                              'my-1 h-8 w-0.5',
                              currentStep > step ? 'bg-ink' : 'bg-ink/15',
                            ].join(' ')}
                          />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className={['font-semibold leading-tight', isCurrent ? 'text-ink' : 'text-ink-soft'].join(' ')}>
                          {ORDER_STATUS[status].label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-ink-muted">{ORDER_STATUS[status].hint}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          {/* Items */}
          <section className="rounded-4xl border border-ink/10 p-6">
            <h2 className="font-display text-lg font-bold tracking-tight">Items</h2>
            <ul className="mt-4 space-y-3">
              {order.items?.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-canvas-2 text-lg">🥟</span>
                    <span>
                      <span className="block font-medium leading-tight">{item.product_name}</span>
                      <span className="text-xs text-ink-muted">
                        {item.quantity} × {peso(item.unit_price)}
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{peso(item.line_total)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium tabular-nums">{peso(order.subtotal)}</dd>
              </div>
              {order.fulfillment === 'delivery' && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Delivery fee</dt>
                  <dd className="font-medium tabular-nums">{peso(order.delivery_fee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-xl font-bold tabular-nums">{peso(order.total)}</dd>
              </div>
            </dl>
          </section>

          {order.note && (
            <section className="rounded-4xl border border-ink/10 p-6">
              <h2 className="font-display text-lg font-bold tracking-tight">Your note</h2>
              <p className="mt-2 text-sm text-ink-soft">{order.note}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-4xl border border-ink/10 p-6">
            <h2 className="font-display text-lg font-bold tracking-tight">Delivery details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-ink-muted">Method</dt>
                <dd className="font-medium">
                  {order.fulfillment === 'delivery' ? '🛵 Delivery' : '🏪 Store pickup'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Contact</dt>
                <dd className="font-medium">{order.contact_name}</dd>
                <dd className="text-ink-muted">{order.contact_phone}</dd>
              </div>
              {order.fulfillment === 'delivery' && order.delivery_address && (
                <div>
                  <dt className="text-ink-muted">
                    {order.address_label ? `${order.address_label} address` : 'Address'}
                  </dt>
                  <dd className="font-medium">{order.delivery_address}</dd>
                  {order.delivery_landmark && (
                    <dd className="text-ink-muted">Near {order.delivery_landmark}</dd>
                  )}
                  {order.eta_minutes && (
                    <dd className="mt-1 inline-block rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                      ETA ~{order.eta_minutes} min
                    </dd>
                  )}
                </div>
              )}
              {order.fulfillment === 'pickup' && (
                <div>
                  <dt className="text-ink-muted">Pick up at</dt>
                  <dd className="font-medium">{order.store?.address}</dd>
                  <dd className="text-ink-muted">Brgy. {order.store?.barangay}</dd>
                </div>
              )}
            </dl>

            {order.fulfillment === 'delivery' && order.delivery_lat && (
              <div className="mt-4">
                <DeliveryMap
                  store={order.store}
                  point={{
                    lat: Number(order.delivery_lat),
                    lng: Number(order.delivery_lng),
                    label: order.delivery_address,
                  }}
                  height={220}
                />
              </div>
            )}
          </div>

          {order.history?.length > 0 && (
            <div className="rounded-4xl border border-ink/10 p-6">
              <h2 className="font-display text-lg font-bold tracking-tight">Activity</h2>
              <ul className="mt-4 space-y-3">
                {[...order.history]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((h) => (
                    <li key={h.id} className="flex gap-3 text-sm">
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-ink/30" />
                      <span>
                        <span className="font-medium">{ORDER_STATUS[h.status]?.label ?? h.status}</span>
                        <span className="block text-xs text-ink-muted">{formatDateTime(h.created_at)}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {canCancel && (
            <Button variant="outline" className="w-full" onClick={handleCancel}>
              Cancel order
            </Button>
          )}
          {order.store?.slug && (
            <Button as={Link} to={`/store/${order.store.slug}`} variant="ghost" className="w-full">
              Order again
            </Button>
          )}
        </aside>
      </div>
    </div>
  )
}
