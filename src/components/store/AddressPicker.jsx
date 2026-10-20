import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'
import { DeliveryMap } from './DeliveryMap'
import { ILIGAN_BARANGAYS } from '../../lib/constants'
import { ILIGAN_CENTER, reverseGeocode, searchAddress } from '../../lib/geocode'
import { distanceKm, etaMinutes, formatDistance } from '../../lib/delivery'

const SAVED_KEY = 'pastel.savedPlaces'

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeSaved(list) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 8)))
  } catch {
    /* ignore quota errors */
  }
}

function CenterTracker({ onMove }) {
  const map = useMap()
  useMapEvents({
    moveend: () => {
      const c = map.getCenter()
      onMove({ lat: c.lat, lng: c.lng })
    },
  })
  return null
}

function FlyTo({ point }) {
  const map = useMap()
  useEffect(() => {
    if (point?.lat) map.flyTo([point.lat, point.lng], 16, { duration: 0.8 })
  }, [map, point?.lat, point?.lng])
  return null
}

export function AddressPicker({ open, store, initial, onClose, onConfirm }) {
  const [step, setStep] = useState('map')
  const [pin, setPin] = useState(initial?.lat ? { lat: initial.lat, lng: initial.lng } : ILIGAN_CENTER)
  const [flyTo, setFlyTo] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saved, setSaved] = useState(() => readSaved())

  const [form, setForm] = useState({
    unit: initial?.unit ?? '',
    street: initial?.street ?? '',
    barangay: initial?.barangay ?? '',
    landmark: initial?.landmark ?? '',
    label: initial?.labelName ?? 'Home',
    contactName: initial?.contactName ?? '',
    contactPhone: initial?.contactPhone ?? '',
  })
  const [errors, setErrors] = useState({})
  const debounce = useRef(null)

  useEffect(() => {
    if (!open) return
    setStep('map')
    setErrors({})
    setPin(initial?.lat ? { lat: initial.lat, lng: initial.lng } : ILIGAN_CENTER)
    setForm({
      unit: initial?.unit ?? '',
      street: initial?.street ?? '',
      barangay: initial?.barangay ?? '',
      landmark: initial?.landmark ?? '',
      label: initial?.labelName ?? 'Home',
      contactName: initial?.contactName ?? '',
      contactPhone: initial?.contactPhone ?? '',
    })
    // Only re-sync when the picker is (re)opened, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const runSearch = useCallback((text) => {
    if (debounce.current) clearTimeout(debounce.current)
    if (!text || text.trim().length < 3) {
      setResults([])
      return
    }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const found = await searchAddress(text)
        setResults(found)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }, [])

  const reverseTimer = useRef(null)

  const onMapMove = useCallback((center) => {
    setPin(center)
    if (reverseTimer.current) clearTimeout(reverseTimer.current)
    reverseTimer.current = setTimeout(async () => {
      try {
        const rev = await reverseGeocode(center.lat, center.lng)
        setForm((f) => ({
          ...f,
          street: rev.landmark || rev.shortLabel || f.street,
          barangay: rev.barangay || f.barangay,
          landmark: rev.landmark || f.landmark,
        }))
      } catch {
        /* offline — keep manual entry */
      }
    }, 700)
  }, [])

  const pickResult = (r) => {
    const point = { lat: r.lat, lng: r.lng }
    setPin(point)
    setFlyTo(point)
    setResults([])
    setQuery(r.shortLabel)
    setForm((f) => ({
      ...f,
      street: r.landmark || f.street || r.shortLabel,
      barangay: r.barangay || f.barangay,
      landmark: r.landmark || f.landmark,
    }))
  }

  const applySavedPlace = (place) => {
    setPin({ lat: place.lat, lng: place.lng })
    setFlyTo({ lat: place.lat, lng: place.lng })
    setForm((f) => ({ ...f, ...place.form }))
  }

  const goToDetails = async () => {
    try {
      const rev = await reverseGeocode(pin.lat, pin.lng)
      setForm((f) => ({
        ...f,
        street: f.street || rev.landmark || rev.shortLabel || '',
        barangay: f.barangay || rev.barangay || '',
        landmark: f.landmark || rev.landmark || '',
      }))
    } catch {
      /* offline — keep manual entry */
    }
    setStep('details')
  }

  const distance = store ? distanceKm(store, pin) : 0
  const eta = store ? etaMinutes(store, pin) : null

  const confirm = () => {
    const next = {}
    if (!form.street.trim()) next.street = 'Street is required.'
    if (!form.barangay) next.barangay = 'Choose a barangay.'
    if (!form.contactName.trim()) next.contactName = 'Contact name is required.'
    if (!form.contactPhone.trim()) next.contactPhone = 'Mobile number is required.'
    setErrors(next)
    if (Object.keys(next).length) return

    const line = [
      form.unit && `${form.unit}`,
      form.street,
      form.barangay && `Brgy. ${form.barangay}`,
      'Iligan City',
    ]
      .filter(Boolean)
      .join(', ')

    const entry = { lat: pin.lat, lng: pin.lng, form: { ...form } }
    const list = [entry, ...saved.filter((s) => !(s.form?.label === form.label))]
    setSaved(list.slice(0, 8))
    writeSaved(list)

    onConfirm({
      lat: pin.lat,
      lng: pin.lng,
      line,
      landmark: form.landmark,
      barangay: form.barangay,
      labelName: form.label,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      etaMinutes: eta,
      distanceKm: distance,
    })
  }

  const savedKeyList = useMemo(() => saved.filter((s) => s.form?.label), [saved])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close address picker"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div className="relative flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-4xl bg-white shadow-2xl sm:h-[88vh] sm:rounded-4xl">
        <header className="border-b border-ink/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">
                {step === 'map' ? 'Set your delivery pin' : 'Address details'}
              </h2>
              <p className="text-xs text-ink-muted">
                {step === 'map'
                  ? 'Drag the map — the pin stays centered.'
                  : 'Add a few details so the rider finds you.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {[
              { key: 'map', label: '1. Pin location' },
              { key: 'details', label: '2. Details' },
            ].map((s, i) => {
              const reached = step === s.key || (s.key === 'map' && step === 'details')
              const isCurrent = step === s.key
              return (
                <div key={s.key} className="flex flex-1 items-center gap-2">
                  <span
                    className={[
                      'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                      isCurrent
                        ? 'bg-ink text-white'
                        : reached
                          ? 'bg-mint text-emerald-900'
                          : 'bg-canvas-2 text-ink-muted',
                    ].join(' ')}
                  >
                    {reached && !isCurrent ? '✓' : i + 1}
                  </span>
                  <span
                    className={[
                      'whitespace-nowrap text-xs font-semibold',
                      isCurrent ? 'text-ink' : 'text-ink-muted',
                    ].join(' ')}
                  >
                    {s.label.replace(/^\d+\.\s*/, '')}
                  </span>
                  {i === 0 && <span className="h-px flex-1 bg-ink/10" />}
                </div>
              )
            })}
          </div>
        </header>

        {step === 'map' ? (
          <>
            <div className="relative flex-1">
              <div className="absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <span className="block size-4 -translate-y-1/2 rounded-full border-[3px] border-white bg-rose-600 shadow-lg" />
              </div>
              <div className="absolute inset-x-0 top-0 z-[1000] p-3">
                <div className="rounded-2xl border border-ink/10 bg-white/95 shadow-lg backdrop-blur">
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      runSearch(e.target.value)
                    }}
                    placeholder="Search a street, landmark, or barangay…"
                    className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                  />
                  {searching && <p className="px-4 pb-2 text-xs text-ink-muted">Searching…</p>}
                  {results.length > 0 && (
                    <ul className="max-h-56 overflow-auto border-t border-ink/10">
                      {results.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => pickResult(r)}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-canvas-2"
                          >
                            <span className="block font-medium">{r.shortLabel}</span>
                            <span className="block truncate text-xs text-ink-muted">{r.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <MapContainer
                center={[pin.lat, pin.lng]}
                zoom={14}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CenterTracker onMove={onMapMove} />
                {flyTo && <FlyTo point={flyTo} />}
              </MapContainer>
            </div>

            {savedKeyList.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-ink/10 px-4 py-3">
                {savedKeyList.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySavedPlace(s)}
                    className="shrink-0 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-canvas-2"
                  >
                    {s.form.label === 'Home' ? '🏠' : s.form.label === 'Work' ? '🏢' : '📍'}{' '}
                    {s.form.label}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-ink/10 p-4">
              <p className="mb-3 text-center text-xs text-ink-muted">
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                {store && distance > 0 ? ` · ${formatDistance(distance)} from store` : ''}
              </p>
              <Button size="lg" className="w-full" onClick={goToDetails}>
                Confirm pin location
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              {/* Pin preview */}
              <div className="overflow-hidden rounded-3xl border border-ink/10 bg-canvas-2">
                <DeliveryMap store={store} point={pin} height={148} className="rounded-none" />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <span aria-hidden="true">📍</span>
                      <span className="truncate">
                        {form.street || form.barangay
                          ? [form.street, form.barangay && `Brgy. ${form.barangay}`]
                              .filter(Boolean)
                              .join(', ')
                          : 'Dropped pin'}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                      {store && distance > 0 ? ` · ${formatDistance(distance)} from store` : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep('map')}>
                    Change pin
                  </Button>
                </div>
              </div>

              {/* Address */}
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Where should we deliver?
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="House / unit no."
                    name="unit"
                    placeholder="e.g. 24-B"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                  <Input
                    label="Street"
                    name="street"
                    placeholder="e.g. Quezon Ave. Ext."
                    value={form.street}
                    error={errors.street}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  />
                  <Select
                    label="Barangay"
                    name="barangay"
                    value={form.barangay}
                    error={errors.barangay}
                    onChange={(e) => setForm((f) => ({ ...f, barangay: e.target.value }))}
                  >
                    <option value="">Select barangay…</option>
                    {form.barangay && !ILIGAN_BARANGAYS.includes(form.barangay) && (
                      <option value={form.barangay}>{form.barangay}</option>
                    )}
                    {ILIGAN_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Landmark (optional)"
                    name="landmark"
                    placeholder="e.g. near City Hall"
                    value={form.landmark}
                    onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                  />
                </div>
              </div>

              {/* Save as */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Save this address as
                </h3>
                <div className="mt-3 flex gap-2">
                  {[
                    { l: 'Home', icon: '🏠' },
                    { l: 'Work', icon: '🏢' },
                    { l: 'Other', icon: '📍' },
                  ].map(({ l, icon }) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, label: l }))}
                      className={[
                        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                        form.label === l
                          ? 'border-ink bg-ink text-white'
                          : 'border-ink/15 hover:border-ink/40',
                      ].join(' ')}
                    >
                      <span aria-hidden="true">{icon}</span>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Who should the rider look for?
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Contact name"
                    name="contactName"
                    placeholder="Juan Dela Cruz"
                    value={form.contactName}
                    error={errors.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  />
                  <Input
                    label="Mobile number"
                    name="contactPhone"
                    placeholder="0917 000 0000"
                    value={form.contactPhone}
                    error={errors.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{formatDistance(distance)} away</span>
                {eta && (
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-emerald-900">
                    ETA ~{eta} min
                  </span>
                )}
              </div>
              <Button size="lg" className="w-full" onClick={confirm}>
                Save address
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
