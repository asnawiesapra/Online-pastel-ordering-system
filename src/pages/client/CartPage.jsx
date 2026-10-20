import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Feedback'
import { QuantityStepper } from '../../components/ui/QuantityStepper'
import { useAuth } from '../../lib/AuthContext'
import { useCart } from '../../lib/CartContext'
import { accent, peso } from '../../lib/constants'

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clearCart, cart, itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const a = accent(cart?.accent)
  const deliveryFee = Number(cart?.deliveryFee ?? 0)
  const minOrder = Number(cart?.minOrder ?? 0)
  const meetsMin = subtotal >= minOrder

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          emoji="🛒"
          title="Your basket is empty"
          description="Browse Iligan's pater houses and add something delicious."
          action={
            <Button as={Link} to="/stores">
              Browse stores
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Basket</span>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Review your order</h1>
          <p className="mt-1 text-sm text-ink-muted">
            From <span className="font-semibold text-ink">{cart?.storeName}</span>
          </p>
        </div>
        <button type="button" onClick={clearCart} className="text-sm font-medium text-red-600 hover:underline">
          Clear basket
        </button>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-4 rounded-4xl border border-ink/10 p-4">
              <div className={['grid size-16 shrink-0 place-items-center rounded-3xl text-3xl', a.bg].join(' ')}>
                {item.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{item.name}</p>
                <p className="text-xs text-ink-muted">
                  {peso(item.price)} / {item.unit}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="mt-1 text-xs text-ink-muted hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-col items-end gap-2">
                <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.productId, q)} />
                <span className="text-sm font-bold tabular-nums">{peso(item.price * item.quantity)}</span>
              </div>
            </li>
          ))}
        </ul>

        <aside>
          <div className="sticky top-24 rounded-4xl border border-ink/10 bg-canvas-2 p-6">
            <h2 className="font-display text-xl font-bold tracking-tight">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Items ({itemCount})</dt>
                <dd className="font-medium tabular-nums">{peso(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery fee</dt>
                <dd className="font-medium tabular-nums">{peso(deliveryFee)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-ink/10 pt-3 text-base">
                <dt className="font-semibold">Estimated total</dt>
                <dd className="font-display text-lg font-bold tabular-nums">{peso(subtotal + deliveryFee)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-ink-muted">
              Pickup orders skip the delivery fee at checkout.
            </p>

            {!meetsMin && (
              <p className="mt-4 rounded-2xl bg-butter px-3 py-2 text-xs font-medium text-yellow-900">
                Minimum order is {peso(minOrder)}. Add {peso(minOrder - subtotal)} more.
              </p>
            )}

            <Button
              className="mt-5 w-full"
              size="lg"
              disabled={!meetsMin}
              onClick={() => navigate(user ? '/checkout' : '/login')}
            >
              {user ? 'Proceed to checkout' : 'Sign in to checkout'}
            </Button>
            <Button as={Link} to={`/store/${cart?.storeSlug}`} variant="ghost" className="mt-2 w-full">
              Add more items
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
