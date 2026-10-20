import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-canvas-2">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold">
              <span className="grid size-9 place-items-center rounded-2xl bg-ink text-white">🥟</span>
              Pater Iligan
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              A community marketplace for Iligan&apos;s homegrown pater houses. Order fresh from
              local kitchens, pick up or have it delivered across the city.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-tight">Order</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link to="/stores" className="hover:text-ink">Browse pater houses</Link></li>
              <li><Link to="/map" className="hover:text-ink">Store map</Link></li>
              <li><Link to="/orders" className="hover:text-ink">Track order</Link></li>
              <li><Link to="/cart" className="hover:text-ink">Your cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-tight">Partners</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              <li><Link to="/become-a-store" className="hover:text-ink">Open a pater house</Link></li>
              <li><Link to="/login" className="hover:text-ink">Store sign in</Link></li>
              <li><Link to="/login" className="hover:text-ink">Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink/10 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} Pater Iligan. Made with care in Iligan City, PH.</p>
          <p>Prices in Philippine Peso (₱). Service hours 6:00 AM – 9:00 PM.</p>
        </div>
      </div>
    </footer>
  )
}
