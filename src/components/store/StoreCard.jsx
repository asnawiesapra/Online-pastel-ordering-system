import { Link } from 'react-router-dom'
import { accent, peso } from '../../lib/constants'
import { sizedImage } from '../../lib/images'
import { Badge } from '../ui/Badge'
import { StoreAvatar } from './StoreAvatar'

export function StoreCard({ store, className = '' }) {
  const a = accent(store.accent)
  const photo = sizedImage(store.image_url, 'card')
  return (
    <Link
      to={`/store/${store.slug}`}
      className={[
        'group relative flex flex-col overflow-hidden rounded-4xl border border-ink/10 bg-white transition-all duration-300',
        'hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)]',
        className,
      ].join(' ')}
    >
      {photo && (
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={photo}
            alt={store.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.closest('div').style.display = 'none'
            }}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <StoreAvatar
            store={store}
            size="lg"
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col items-end gap-1.5">
            <Badge tone="neutral">⭐ {store.rating}</Badge>
            <Badge tone={store.is_open ? 'mint' : 'blush'}>
              <span className="size-1.5 rounded-full bg-current opacity-70" />
              {store.is_open ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </div>

        <h3 className="mt-4 font-display text-lg font-bold leading-tight tracking-tight">
          {store.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{store.description}</p>

        <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
          <span className="rounded-full bg-canvas-2 px-2.5 py-1 font-medium">Brgy. {store.barangay}</span>
          <span className="rounded-full bg-canvas-2 px-2.5 py-1 font-medium">~{store.prep_minutes} min</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-4 text-xs">
          <span className="text-ink-muted">
            Delivery <span className="font-semibold text-ink">{peso(store.delivery_fee)}</span>
          </span>
          <span className="font-semibold text-ink transition-transform duration-300 group-hover:translate-x-0.5">
            Order →
          </span>
        </div>
      </div>
    </Link>
  )
}
