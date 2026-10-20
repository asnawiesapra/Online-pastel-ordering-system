import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AddressPicker } from '../../components/store/AddressPicker'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import { useAuth } from '../../lib/AuthContext'
import { useToast } from '../../lib/ToastContext'
import { accent, initials, ILIGAN_BARANGAYS } from '../../lib/constants'

export default function ProfilePage() {
  const { profile, user, updateProfile, uploadAvatar, refreshProfile, isStore } = useAuth()
  const toast = useToast()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    barangay: '',
    address_label: 'Home',
  })
  const [pin, setPin] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      address: profile.address ?? '',
      barangay: profile.barangay ?? '',
      address_label: profile.address_label ?? 'Home',
    })
    setPin(
      profile.delivery_lat && profile.delivery_lng
        ? { lat: Number(profile.delivery_lat), lng: Number(profile.delivery_lng) }
        : null,
    )
  }, [profile])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadAvatar(file)
      await updateProfile({ avatar_url: url })
      toast.success('Profile photo updated.')
    } catch (err) {
      toast.error(err.message || 'Could not upload photo.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'Full name is required.'
    if (!form.phone.trim()) next.phone = 'Contact number is required.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || null,
        barangay: form.barangay || null,
        address_label: form.address_label || null,
        delivery_lat: pin?.lat ?? null,
        delivery_lng: pin?.lng ?? null,
      })
      await refreshProfile()
      toast.success('Profile saved.')
    } catch (err) {
      toast.error(err.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const a = accent('mint')

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Account</span>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          These details are used to prefill your orders and deliveries.
        </p>
      </header>

      <form onSubmit={save} className="mt-8 space-y-6">
        <section className="rounded-4xl border border-ink/10 p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={form.full_name}
                  className="size-24 rounded-4xl border border-ink/10 object-cover"
                />
              ) : (
                <span className="grid size-24 place-items-center rounded-4xl bg-ink font-display text-3xl font-bold text-white">
                  {initials(form.full_name || user?.email)}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-ink/10 bg-white text-sm shadow-sm transition hover:border-ink/40"
                aria-label="Change photo"
              >
                {uploading ? '…' : '📷'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPickAvatar}
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-display text-xl font-bold tracking-tight">
                {form.full_name || 'Your name'}
              </p>
              <p className="text-sm text-ink-muted">{user?.email}</p>
              <span className={['mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold', a.bg, a.text].join(' ')}>
                {profile?.role ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)} account` : 'Client account'}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              name="full_name"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              value={form.full_name}
              error={errors.full_name}
              onChange={set('full_name')}
            />
            <Input
              label="Contact number"
              name="phone"
              autoComplete="tel"
              placeholder="0917 000 0000"
              value={form.phone}
              error={errors.phone}
              onChange={set('phone')}
            />
          </div>
        </section>

        <section className="rounded-4xl border border-ink/10 p-6">
          <h2 className="font-display text-lg font-bold tracking-tight">Default delivery address</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Used to prefill checkout. You can still change it per order.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select label="Barangay" name="barangay" value={form.barangay} onChange={set('barangay')}>
              <option value="">Select barangay…</option>
              {ILIGAN_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
            <Select label="Label" name="address_label" value={form.address_label} onChange={set('address_label')}>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-sm font-semibold tracking-tight text-ink">
              Street / landmark
            </span>
            {pin && form.address ? (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-ink/15 bg-white p-4">
                <div className="flex items-start gap-3 text-sm">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blush text-lg">
                    {form.address_label === 'Home' ? '🏠' : form.address_label === 'Work' ? '🏢' : '📍'}
                  </span>
                  <div>
                    <span className="block font-semibold">{form.address_label}</span>
                    <span className="block text-ink-muted">{form.address}</span>
                    <span className="block text-xs text-ink-muted">
                      {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                    </span>
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
                className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-4 text-left transition hover:border-ink/40"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-canvas-2 text-lg">📍</span>
                  <span>
                    <span className="block text-sm font-bold">Pin your address on the map</span>
                    <span className="block text-xs text-ink-muted">
                      Search or drag the map, like Grab
                    </span>
                  </span>
                </span>
                <span className="text-ink-muted">→</span>
              </button>
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          {isStore && (
            <Button as={Link} to="/dashboard/settings" variant="outline" size="lg">
              Store settings
            </Button>
          )}
        </div>
      </form>

      <AddressPicker
        open={pickerOpen}
        initial={{
          lat: pin?.lat,
          lng: pin?.lng,
          street: form.address,
          barangay: form.barangay,
          labelName: form.address_label,
          contactName: form.full_name,
          contactPhone: form.phone,
        }}
        onClose={() => setPickerOpen(false)}
        onConfirm={(picked) => {
          setPin({ lat: picked.lat, lng: picked.lng })
          setForm((f) => ({
            ...f,
            address: picked.line,
            barangay: picked.barangay || f.barangay,
            address_label: picked.labelName || f.address_label,
          }))
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
