import { useCallback, useState } from 'react'
import { Badge } from '../ui/Badge'

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const dec = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(Math.max(min, value - 1))
  }, [value, onChange, min])

  const inc = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(Math.min(max, value + 1))
  }, [value, onChange, max])

  const dims = size === 'sm' ? 'size-7 text-sm' : 'size-9 text-base'
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white p-1">
      <button
        type="button"
        onClick={dec}
        aria-label="Decrease quantity"
        disabled={value <= min}
        className={[dims, 'grid place-items-center rounded-full font-bold text-ink transition hover:bg-ink/5 disabled:opacity-30'].join(' ')}
      >
        −
      </button>
      <span className={['min-w-6 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : ''].join(' ')}>
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        aria-label="Increase quantity"
        disabled={value >= max}
        className={[dims, 'grid place-items-center rounded-full font-bold text-ink transition hover:bg-ink/5 disabled:opacity-30'].join(' ')}
      >
        +
      </button>
    </div>
  )
}

export function useStepper(initial = 1) {
  const [value, setValue] = useState(initial)
  return { value, setValue, reset: () => setValue(initial) }
}

export function StoreChip({ store, className = '' }) {
  return (
    <Badge tone={store?.accent ?? 'neutral'} className={className}>
      {store?.hero_emoji} {store?.name}
    </Badge>
  )
}
