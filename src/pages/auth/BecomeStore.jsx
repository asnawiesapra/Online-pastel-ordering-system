import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddressPicker } from '../../components/store/AddressPicker'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { ImageUploadField } from '../../components/ui/ImageUploadField'
import { createStore } from '../../lib/api'
import { useAuth } from '../../lib/AuthContext'
import { useToast } from '../../lib/ToastContext'
import { ACCENT_KEYS, ILIGAN_BARANGAYS, slugify } from '../../lib/constants'

const perks = [
  { emoji: '📲', title: 'Live order board', text: 'Accept and update orders in real time.' },
  { emoji: '🧾', title: 'Your own menu', text: 'Add items, prices, and mark items sold out.' },
  { emoji: '🗺️', title: 'Show up on the map', text: 'Reach customers across Iligan City.' },
]

export default function BecomeStore() {
  const { user, profile, refreshProfile, uploadImage } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    barangay: 'Poblacion',
    phone: profile?.phone ?? '',
    accent: 'mint',
    hero_emoji: '🥟',
    prep_minutes: 20,
    delivery_fee: 39,
    min_order: 100,
    image_url: '',
    avatar_url: '',
  })
  const [pin, setPin] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('Store name is required.')
      return
    }
    setLoading(true)
    try {
      const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`
      await createStore({
        owner_id: user.id,
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        address: form.address.trim(),
        barangay: form.barangay,
        phone: form.phone.trim(),
        accent: form.accent,
        hero_emoji: form.hero_emoji || '🥟',
        image_url: form.image_url.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        prep_minutes: Number(form.prep_minutes) || 20,
        delivery_fee: Number(form.delivery_fee) || 0,
        min_order: Number(form.min_order) || 0,
        lat: pin?.lat ?? 8.228 + Math.random() * 0.02,
        lng: pin?.lng ?? 124.24 + Math.random() * 0.025,
        status: 'pending',
      })
      await refreshProfile()
      toast.success('Application submitted! An admin will review it shortly.')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Could not submit your application.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Partners</span>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Sell your pater to all of Iligan
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
            Apply to list your pater house on Pater Iligan. Once approved by an admin, your store
            goes live on the storefront and the city map.
          </p>

          <div className="mt-8 space-y-4">
            {perks.map((p) => (
              <div key={p.title} className="flex items-start gap-4 rounded-3xl border border-ink/10 p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-canvas-2 text-2xl">
                  {p.emoji}
                </span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-ink-muted">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!user ? (
            <div className="rounded-4xl border border-ink/10 bg-canvas-2 p-8 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-4xl bg-white text-3xl">
                🔐
              </div>
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight">Sign in to apply</h2>
              <p className="mt-2 text-sm text-ink-muted">
                You need an account before you can register a store.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button as={Link} to="/login" state={{ from: '/become-a-store' }}>
                  Sign in
                </Button>
                <Button as={Link} to="/register" variant="outline">
                  Register
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 rounded-4xl border border-ink/10 bg-white p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">Store application</h2>

              <Input label="Store name" name="name" placeholder="Pater Al-Kuwait City Plaza" value={form.name} onChange={set('name')} required />
              <Textarea label="Short description" name="description" rows={2} placeholder="What makes your pater special?" value={form.description} onChange={set('description')} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Street address" name="address" placeholder="Rizal Ave, near…" value={form.address} onChange={set('address')} />
                <Select label="Barangay" name="barangay" value={form.barangay} onChange={set('barangay')}>
                  {ILIGAN_BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Contact number" name="phone" placeholder="0917 000 0000" value={form.phone} onChange={set('phone')} />
                <Input label="Store icon (emoji)" name="hero_emoji" maxLength={2} value={form.hero_emoji} onChange={set('hero_emoji')} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Prep (minutes)" name="prep_minutes" type="number" min={5} value={form.prep_minutes} onChange={set('prep_minutes')} />
                <Input label="Delivery fee (₱)" name="delivery_fee" type="number" min={0} value={form.delivery_fee} onChange={set('delivery_fee')} />
                <Input label="Minimum order (₱)" name="min_order" type="number" min={0} value={form.min_order} onChange={set('min_order')} />
              </div>

              <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
                <ImageUploadField
                  label="Profile picture"
                  folder="store-avatars"
                  aspect="square"
                  round
                  emoji={form.hero_emoji || '🥟'}
                  value={form.avatar_url}
                  upload={uploadImage}
                  hint="Shown on cards & map."
                  onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
                />
                <ImageUploadField
                  label="Cover photo (optional)"
                  folder="stores"
                  aspect="video"
                  emoji={form.hero_emoji || '🥟'}
                  value={form.image_url}
                  upload={uploadImage}
                  hint="Wide banner on your store page."
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold tracking-tight">Store location</span>
                {pin ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-white p-4">
                    <span className="flex items-center gap-3 text-sm">
                      <span className="grid size-9 place-items-center rounded-xl bg-sky text-lg">📍</span>
                      <span>
                        <span className="block font-semibold">Pin set</span>
                        <span className="block text-xs text-ink-muted">
                          {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                        </span>
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
                      <span>
                        <span className="block text-sm font-bold">Drop your store pin</span>
                        <span className="block text-xs text-ink-muted">
                          So riders and customers find you exactly
                        </span>
                      </span>
                    </span>
                    <span className="text-ink-muted">→</span>
                  </button>
                )}
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold tracking-tight">Brand accent</span>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accent: key }))}
                      aria-label={key}
                      className={[
                        'size-10 rounded-2xl border-2 transition',
                        form.accent === key ? 'border-ink' : 'border-transparent',
                        `bg-${key}`,
                      ].join(' ')}
                      style={{ backgroundColor: {
                        mint: '#cdeee0', peach: '#ffe0d1', lilac: '#e4dcfb',
                        butter: '#fdf0c4', blush: '#fcdce6', sky: '#d6ecfb',
                      }[key] }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-2xl bg-blush px-3 py-2 text-sm font-medium text-pink-900">{error}</p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit application'}
              </Button>
              <p className="text-center text-xs text-ink-muted">
                Stores start as &ldquo;pending&rdquo; until an admin approves them.
              </p>
            </form>
          )}
        </div>
      </div>

      <AddressPicker
        open={pickerOpen}
        initial={pin}
        onClose={() => setPickerOpen(false)}
        onConfirm={(picked) => {
          setPin({ lat: picked.lat, lng: picked.lng })
          if (!form.address && picked.line) setForm((f) => ({ ...f, address: picked.line }))
          if (picked.barangay) setForm((f) => ({ ...f, barangay: picked.barangay }))
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
