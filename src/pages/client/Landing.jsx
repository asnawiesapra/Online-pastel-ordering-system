import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IliganMap } from '../../components/store/IliganMap'
import { StoreCard } from '../../components/store/StoreCard'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton } from '../../components/ui/Feedback'
import { fetchStores } from '../../lib/api'
import { ILIGAN_BARANGAYS } from '../../lib/constants'

const steps = [
  { emoji: '🗺️', title: 'Pick a pater house', text: 'Browse Iligan pater shops by barangay across the city.' },
  { emoji: '🥟', title: 'Build your order', text: 'Mix beef, chicken, and special pater in one order.' },
  { emoji: '🛵', title: 'Pickup or delivery', text: 'Collect in-store or have it brought to your doorstep.' },
]

export default function Landing() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStores()
      .then(setStores)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const featured = useMemo(() => stores.slice(0, 6), [stores])
  const topRated = useMemo(
    () => [...stores].sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3),
    [stores],
  )

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-40" />
        <div className="absolute -left-24 top-10 size-72 rounded-full bg-mint blur-3xl" />
        <div className="absolute right-0 top-40 size-80 rounded-full bg-peach blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-tight">
                <span className="size-1.5 rounded-full bg-mint-deep" />
                Now serving all of Iligan City
              </span>

              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Iligan&apos;s best pater,
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">delivered warm.</span>
                  <span className="absolute inset-x-0 bottom-1.5 z-0 h-4 bg-butter" />
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted">
                Order fresh pater from Iligan&apos;s homegrown pater houses in Poblacion, Tibanga,
                Santiago and more. Pickup or delivery, always cooked to order.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button as={Link} to="/stores" size="lg">
                  Browse stores
                </Button>
                <Button as={Link} to="/map" size="lg" variant="outline">
                  See the map 🗺️
                </Button>
              </div>

              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink/10 pt-8">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">Stores</dt>
                  <dd className="mt-1 font-display text-2xl font-bold">{stores.length || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">Barangays</dt>
                  <dd className="mt-1 font-display text-2xl font-bold">{ILIGAN_BARANGAYS.length}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-muted">Avg prep</dt>
                  <dd className="mt-1 font-display text-2xl font-bold">~20m</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -left-4 -top-4 hidden size-24 animate-float rounded-4xl bg-lilac sm:block" />
                <div className="absolute -bottom-6 -right-4 hidden size-20 animate-float rounded-4xl bg-butter [animation-delay:1.5s] sm:block" />
                <div className="relative overflow-hidden rounded-5xl border border-ink/10 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-10 place-items-center rounded-2xl bg-peach text-xl">🥟</span>
                      <div>
                        <p className="text-sm font-bold leading-tight">Pater Al-Kuwait City Plaza</p>
                        <p className="text-xs text-ink-muted">Brgy. Poblacion</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-emerald-900">
                      Open
                    </span>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {[
                      { e: '🥟', n: 'Beef Pater', p: '₱80.00' },
                      { e: '🌟', n: 'Special Beef Pater', p: '₱95.00' },
                      { e: '🎉', n: 'Barkada Pack · 5', p: '₱375.00' },
                    ].map((row) => (
                      <div key={row.n} className="flex items-center gap-3 rounded-2xl border border-ink/8 p-2.5">
                        <span className="grid size-9 place-items-center rounded-xl bg-canvas-2 text-lg">{row.e}</span>
                        <span className="flex-1 text-sm font-medium">{row.n}</span>
                        <span className="text-sm font-bold">{row.p}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-3xl bg-ink px-5 py-4 text-white">
                    <span className="text-sm font-medium opacity-80">Basket total</span>
                    <span className="font-display text-xl font-bold">₱550.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED STORES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Pater houses near you</h2>
            <p className="mt-2 text-sm text-ink-muted">Handpicked pater spots across Iligan City.</p>
          </div>
          <Button as={Link} to="/stores" variant="outline" size="sm" className="hidden sm:inline-flex">
            View all
          </Button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-60" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No stores yet"
              description="Run the seed SQL in Supabase to load the Iligan pater houses."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </section>

      {/* MAP */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-5xl border border-ink/10 bg-canvas-2 p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">The city map</span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                Find pater around Iligan
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                An illustrated map of Iligan City. Hover a pin to see the pater house, its barangay,
                and delivery fee. Tap through to start an order.
              </p>
              <Button as={Link} to="/map" className="mt-6">
                Open full map
              </Button>
            </div>
            <div className="rounded-4xl bg-white p-3 shadow-sm">
              <IliganMap stores={topRated.length ? topRated : featured.slice(0, 5)} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-4xl border border-ink/10 p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-3xl bg-canvas-2 text-3xl">
                  {step.emoji}
                </span>
                <span className="font-display text-4xl font-bold text-ink/10">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-5xl bg-ink px-8 py-14 text-center text-white sm:px-16">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-mint/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 size-48 rounded-full bg-peach/20 blur-2xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Own a pater house in Iligan?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
              Join the marketplace, manage orders in real time, and reach hungry Iliganons across the city.
            </p>
            <Button as={Link} to="/become-a-store" variant="pastel" size="lg" className="mt-8">
              List your store
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
