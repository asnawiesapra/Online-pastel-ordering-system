import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Feedback'
import { Input, Textarea } from '../../components/ui/Field'
import { AddressPicker } from '../../components/store/AddressPicker'
import { placeOrder } from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import { useCart } from '../../lib/CartContext'
import { useToast } from '../../lib/ToastContext'
import { accent, peso } from '../../lib/constants'

export default function CheckoutPage() {
  const { profile, updateProfile } = useAuth()
  const { items, subtotal, cart, clearCart, itemCount } = useCart()
  const navigate = useNavigate()
  const toast = useToast()

  const [fulfillment, setFulfillment] = useState('pickup')
  const [contactName, setContactName] = useState(profile?.full_name ?? '')
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '')
  const [address, setAddress] = useState(
    profile?.address
      ? {
          lat: profile.delivery_lat ? Number(profile.delivery_lat) : null,
          lng: profile.delivery_lng ? Number(profile.delivery_lng) : null,
          line: profile.address,
          barangay: profile.barangay ?? '',
          landmark: '',
          labelName: profile.address_label ?? 'Home',
          contactName: profile.full_name ?? '',
          contactPhone: profile.phone ?? '',
        }
      : null,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveProfile, setSaveProfile] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const a = accent(cart?.accent)
  const deliveryFee = fulfillment === 'delivery' ? Number(cart?.deliveryFee ?? 0) : 0
  const total = subtotal + deliveryFee
  const minOrder = Number(cart?.minOrder ?? 0)
  const meetsMin = subtotal >= minOrder

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          emoji="🛒"
          title="Nothing to check out"
          description="Your basket is empty. Add items from a store first."
          action={
            <Button as={Link} to="/stores">
              Browse stores
            </Button>
          }
        />
      </div>
    )
  }

  const validate = () => {
    const next = {}
    if (!contactName.trim()) next.contactName = 'Please enter a contact name.'
    if (!contactPhone.trim()) next.contactPhone = 'Please enter a mobile number.'
    else if (!/^[0-9+\s-]{7,}$/.test(contactPhone.trim())) next.contactPhone = 'Enter a valid number.'
    if (fulfillment === 'delivery' && !address) next.address = 'Delivery address is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const orderId = await placeOrder({
        p_store_id: cart.storeId,
        p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        p_fulfillment: fulfillment,
        p_note: note,
        p_contact_name: contactName,
        p_contact_phone: contactPhone,
        p_delivery_address: fulfillment === 'delivery' ? address?.line ?? null : null,
        p_delivery_lat: fulfillment === 'delivery' ? address?.lat ?? null : null,
        p_delivery_lng: fulfillment === 'delivery' ? address?.lng ?? null : null,
        p_delivery_barangay: fulfillment === 'delivery' ? address?.barangay ?? null : null,
        p_delivery_landmark: fulfillment === 'delivery' ? address?.landmark ?? null : null,
        p_address_label: fulfillment === 'delivery' ? address?.labelName ?? null : null,
        p_eta_minutes: fulfillment === 'delivery' ? address?.etaMinutes ?? null : null,
      })
      if (fulfillment === 'delivery' && address?.line) {
        const missing = !profile?.address
        if (saveProfile || missing) {
          updateProfile({
            address: address.line,
            barangay: address.barangay ?? profile?.barangay ?? null,
            address_label: address.labelName ?? 'Home',
            delivery_lat: address.lat ?? null,
            delivery_lng: address.lng ?? null,
          }).catch(() => {})
        }
      }
      clearCart()
      toast.success('Order placed! Salamat!')
      navigate(`/order/${orderId}`)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not place the order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Checkout</span>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Almost there</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ordering from <span className="font-semibold text-ink">{cart?.storeName}</span> ·{' '}
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-4xl border border-ink/10 p-6">
            <h2 className="font-display text-lg font-bold tracking-tight">How would you like it?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { value: 'pickup', emoji: '🏪', title: 'Pickup', text: 'Collect at the store' },
                {
                  value: 'delivery',
                  emoji: '🛵',
                  title: 'Delivery',
                  text: `Add ${peso(cart?.deliveryFee ?? 0)} delivery fee`,
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFulfillment(opt.value)}
                  className={[
                    'flex items-center gap-3 rounded-3xl border-2 p-4 text-left transition',
                    fulfillment === opt.value
                      ? 'border-ink bg-canvas-2'
                      : 'border-ink/10 hover:border-ink/30',
                  ].join(' ')}
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-white text-2xl">
                    {opt.emoji}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{opt.title}</span>
                    <span className="block text-xs text-ink-muted">{opt.text}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-4xl border border-ink/10 p-6">
            <h2 className="font-display text-lg font-bold tracking-tight">Contact details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact name"
                name="contactName"
                placeholder="Juan Dela Cruz"
                value={contactName}
                error={errors.contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <Input
                label="Mobile number"
                name="contactPhone"
                placeholder="0917 000 0000"
                value={contactPhone}
                error={errors.contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            {fulfillment === 'delivery' && (
              <div className="mt-4">
                <span className="mb-1.5 block text-sm font-semibold tracking-tight text-ink">
                  Delivery address
                </span>
                {address ? (
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-ink/15 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blush text-lg">
                        {address.labelName === 'Home' ? '🏠' : address.labelName === 'Work' ? '🏢' : '📍'}
                      </span>
                      <div className="text-sm">
                        <span className="block font-semibold">{address.labelName}</span>
                        <span className="block text-ink-muted">{address.line}</span>
                        {address.landmark && (
                          <span className="block text-xs text-ink-muted">Near {address.landmark}</span>
                        )}
                        {address.etaMinutes && (
                          <span className="mt-1 inline-block rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                            ETA ~{address.etaMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="shrink-0 text-xs font-bold text-ink-muted underline hover:text-ink"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className={[
                      'flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed p-4 text-left transition',
                      errors.address ? 'border-red-400' : 'border-ink/20 hover:border-ink/40',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-canvas-2 text-lg">📍</span>
                      <span>
                        <span className="block text-sm font-bold">Pin your delivery location</span>
                        <span className="block text-xs text-ink-muted">
                          Search or drag the map, like Grab
                        </span>
                      </span>
                    </span>
                    <span className="text-ink-muted">→</span>
                  </button>
                )}
                {errors.address && (
                  <span className="mt-1 block text-xs font-medium text-red-600">{errors.address}</span>
                )}
                {address && (
                  <label className="mt-2 flex items-center gap-2 text-xs font-medium text-ink-muted">
                    <input
                      type="checkbox"
                      checked={saveProfile}
                      onChange={(e) => setSaveProfile(e.target.checked)}
                    />
                    Save this address to my profile
                  </label>
                )}
              </div>
            )}

            <Textarea
              label="Notes for the store"
              name="note"
              rows={2}
              className="mt-4"
              placeholder="Less salt, extra sauce, cut into pieces…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </section>
        </div>

        <aside>
          <div className="sticky top-24 rounded-4xl border border-ink/10 bg-canvas-2 p-6">
            <h2 className="font-display text-xl font-bold tracking-tight">Order summary</h2>
            <ul className="mt-4 space-y-2.5">
              {items.map((i) => (
                <li key={i.productId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex items-start gap-2">
                    <span className={['grid size-8 shrink-0 place-items-center rounded-xl text-base', a.bg].join(' ')}>
                      {i.emoji}
                    </span>
                    <span>
                      <span className="block font-medium leading-tight">{i.name}</span>
                      <span className="text-xs text-ink-muted">
                        {i.quantity} × {peso(i.price)}
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{peso(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium tabular-nums">{peso(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="font-medium tabular-nums">
                  {fulfillment === 'delivery' ? peso(deliveryFee) : '—'}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-xl font-bold tabular-nums">{peso(total)}</dd>
              </div>
            </dl>

            {!meetsMin && (
              <p className="mt-4 rounded-2xl bg-butter px-3 py-2 text-xs font-medium text-yellow-900">
                Minimum order is {peso(minOrder)}.
              </p>
            )}

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || !meetsMin}>
              {submitting ? 'Placing order…' : `Place order · ${peso(total)}`}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-muted">
              Pay on pickup or delivery (cash / GCash arranged with the store).
            </p>
          </div>
        </aside>
      </form>

      <AddressPicker
        open={pickerOpen}
        store={{ lat: cart?.storeLat, lng: cart?.storeLng, prep_minutes: cart?.prepMinutes }}
        initial={address}
        onClose={() => setPickerOpen(false)}
        onConfirm={(picked) => {
          setAddress(picked)
          if (!contactName && picked.contactName) setContactName(picked.contactName)
          if (!contactPhone && picked.contactPhone) setContactPhone(picked.contactPhone)
          setPickerOpen(false)
          setErrors((e) => ({ ...e, address: undefined }))
        }}
      />
    </div>
  )
}
