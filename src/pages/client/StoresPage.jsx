import { useEffect, useMemo, useState } from 'react'
import { StoreCard } from '../../components/store/StoreCard'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton } from '../../components/ui/Feedback'
import { Input, Select } from '../../components/ui/Field'
import { fetchStores } from '../../lib/api'
import { ILIGAN_BARANGAYS } from '../../lib/constants'

const sorts = [
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'prep', label: 'Fastest prep' },
  { value: 'fee', label: 'Lowest delivery fee' },
]

export default function StoresPage() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [barangay, setBarangay] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('rating')
  const [openOnly, setOpenOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchStores()
      .then(setStores)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    let list = stores
    if (barangay) list = list.filter((s) => s.barangay === barangay)
    if (openOnly) list = list.filter((s) => s.is_open)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.barangay.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'prep') return a.prep_minutes - b.prep_minutes
      if (sort === 'fee') return Number(a.delivery_fee) - Number(b.delivery_fee)
      return Number(b.rating) - Number(a.rating)
    })
  }, [stores, barangay, search, sort, openOnly])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Browse</span>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Pater houses</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {loading ? 'Loading…' : `${visible.length} store${visible.length === 1 ? '' : 's'} across Iligan City`}
        </p>
      </header>

      <div className="mt-8 grid gap-3 rounded-4xl border border-ink/10 bg-canvas-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          name="search"
          placeholder="Store or barangay…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select label="Barangay" name="barangay" value={barangay} onChange={(e) => setBarangay(e.target.value)}>
          <option value="">All barangays</option>
          {ILIGAN_BARANGAYS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select label="Sort by" name="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setOpenOnly((v) => !v)}
            className={[
              'flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition',
              openOnly ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white text-ink hover:border-ink/40',
            ].join(' ')}
          >
            <span className={['size-2 rounded-full', openOnly ? 'bg-mint-deep' : 'bg-ink/20'].join(' ')} />
            Open now only
          </button>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-60" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No stores match your filters"
            description="Try a different barangay, clear the search, or show closed stores."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setBarangay('')
                  setSearch('')
                  setOpenOnly(false)
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
