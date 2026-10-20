import { peso } from '../../lib/constants'
import { sizedImage } from '../../lib/images'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { QuantityStepper } from '../ui/QuantityStepper'
import { SmartImage } from '../ui/SmartImage'

export function ProductCard({ product, store, quantity = 0, onAdd, onQuantityChange }) {
  const soldOut = !product.is_available
  const photo = sizedImage(product.image_url, 'card')

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white p-4 transition-all duration-300 hover:border-ink/25 hover:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)]">
      <div className="flex gap-4">
        <SmartImage
          src={photo}
          alt={product.name}
          emoji={product.emoji}
          accentName={store?.accent}
          ratio="square"
          className={[
            'size-16 shrink-0 rounded-3xl transition-transform duration-300 group-hover:scale-105',
            soldOut ? 'grayscale' : '',
          ].join(' ')}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight tracking-tight">{product.name}</h3>
            {product.is_featured && !soldOut && <Badge tone="butter">Popular</Badge>}
            {soldOut && <Badge tone="neutral">Sold out</Badge>}
          </div>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.description}</p>
          )}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-lg font-bold">{peso(product.price)}</span>
            <span className="text-xs text-ink-muted">/ {product.unit}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        {soldOut ? (
          <Button variant="outline" size="sm" disabled>
            Unavailable
          </Button>
        ) : quantity > 0 ? (
          <QuantityStepper value={quantity} onChange={(q) => onQuantityChange(q)} />
        ) : (
          <Button size="sm" accent={store?.accent} variant="pastel" onClick={() => onAdd(product)}>
            + Add to basket
          </Button>
        )}
      </div>
    </div>
  )
}
