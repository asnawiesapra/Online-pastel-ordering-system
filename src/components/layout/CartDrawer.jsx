import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../lib/CartContext'
import { accent, peso } from '../../lib/constants'
import { Button } from '../ui/Button'
import { QuantityStepper } from '../ui/QuantityStepper'

export function CartDrawer({ open, onClose }) {
  const { items, subtotal, itemCount, setQuantity, removeItem, clearCart, cart } = useCart()
  const navigate = useNavigate()
  const a = accent(cart?.accent)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const deliveryFee = cart?.deliveryFee ?? 0
  const meetsMin = subtotal >= (cart?.minOrder ?? 0)

  return (
    <>
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />
      <aside
        aria-hidden={!open}
        className={[
          'fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className={['flex items-center justify-between px-5 py-4', a.bg].join(' ')}>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Your basket</h2>
            <p className="text-xs font-medium text-ink-soft">
              {cart?.storeName || 'Empty'} · {itemCount} item{itemCount === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="grid size-9 place-items-center rounded-full bg-white/70 text-ink transition hover:bg-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto mb-4 grid size-20 place-items-center rounded-4xl bg-canvas-2 text-4xl">
                  🛒
                </div>
                <p className="font-display text-lg font-semibold">Your basket is empty</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Add some fresh pater from an Iligan store.
                </p>
                <Button as={Link} to="/stores" onClick={onClose} className="mt-5">
                  Browse pater houses
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="animate-rise flex gap-3 rounded-3xl border border-ink/10 p-3"
                >
                  <div className={['grid size-14 shrink-0 place-items-center rounded-2xl text-2xl', a.bg].join(' ')}>
                    {item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold leading-tight">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="text-xs text-ink-muted transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {peso(item.price)} / {item.unit}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        min={1}
                        onChange={(q) => setQuantity(item.productId, q)}
                      />
                      <span className="text-sm font-bold tabular-nums">
                        {peso(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ink/10 px-5 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{peso(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Delivery fee (if delivery)</dt>
                <dd className="tabular-nums">{peso(deliveryFee)}</dd>
              </div>
            </dl>

            {!meetsMin && (
              <p className="mt-3 rounded-2xl bg-butter px-3 py-2 text-xs font-medium text-yellow-900">
                Add {peso((cart?.minOrder ?? 0) - subtotal)} more to reach the minimum order of{' '}
                {peso(cart?.minOrder ?? 0)}.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="md" onClick={clearCart} className="px-4">
                Clear
              </Button>
              <Button
                className="flex-1"
                disabled={!meetsMin}
                onClick={() => {
                  onClose()
                  navigate('/checkout')
                }}
              >
                Checkout · {peso(subtotal)}
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
