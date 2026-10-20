import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LiveStoreMap } from '../../components/store/DeliveryMap'
import { IliganMap } from '../../components/store/IliganMap'
import { StoreAvatar } from '../../components/store/StoreAvatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Feedback'
import { Select } from '../../components/ui/Field'
import { fetchStores } from '../../lib/api'
import { ILIGAN_BARANGAYS, peso } from '../../lib/constants'
export default function MapPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [selected, setSelected] = useState(null)
  const [barangay, setBarangay] = useState('')
  const [view, setView] = useState('illustrated')

  useEffect(() => {
    fetchStores()
      .then((data) => {
        setStores(data)
        setSelected(data[0] ?? null)
      })
      .catch((e) => console.error(e))
  }, [])

  const filtered = useMemo(
    () => (barangay ? stores.filter((s) => s.barangay === barangay) : stores),
    [stores, barangay],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
            {view === 'illustrated' ? 'Illustrated map' : 'Live map'}
          </span>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Pater map of Iligan</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {view === 'illustrated'
              ? `An illustrated guide to ${stores.length} pater houses across the city.`
              : `Live OpenStreetMap view of ${stores.length} pater houses.`}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          <div className="inline-flex rounded-full border border-ink/15 bg-white p-1">
            {[
              { key: 'illustrated', label: '🎨 Illustrated' },
              { key: 'live', label: '🛰️ Live map' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setView(opt.key)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  view === opt.key ? 'bg-ink text-white' : 'text-ink hover:bg-canvas-2',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="w-full sm:w-56">
            <Select label="Filter by barangay" value={barangay} onChange={(e) => setBarangay(e.target.value)}>
              <option value="">All barangays</option>
              {ILIGAN_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </header>

      {stores.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            emoji="🗺️"
            title="No stores on the map yet"
            description="Seed the demo stores in Supabase to populate the Iligan map."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {view === 'illustrated' ? (
            <IliganMap stores={filtered} selectedId={selected?.id} onSelect={setSelected} />
          ) : (
            <LiveStoreMap
              stores={filtered}
              selectedId={selected?.id}
              onSelect={setSelected}
              height={560}
            />
          )}

          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">
              {barangay ? `Brgy. ${barangay}` : 'All stores'}
              <span className="ml-2 text-sm font-medium text-ink-muted">({filtered.length})</span>
            </h2>

            <ul className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {filtered.map((store) => {
                const isActive = store.id === selected?.id
                return (
                  <li key={store.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setSelected(store)}
                      onClick={() => setSelected(store)}
                      className={[
                        'w-full rounded-3xl border p-4 text-left transition-all',
                        isActive
                          ? 'border-ink bg-canvas-2 shadow-sm'
                          : 'border-ink/10 bg-white hover:border-ink/30',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <StoreAvatar store={store} size="md" rounded="2xl" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold leading-tight">{store.name}</p>
                            <Badge tone={store.is_open ? 'mint' : 'blush'}>
                              {store.is_open ? 'Open' : 'Closed'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            Brgy. {store.barangay} · ⭐ {store.rating}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">Delivery {peso(store.delivery_fee)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            {selected && (
              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={() => navigate(`/store/${selected.slug}`)}
              >
                Order from {selected.name}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
