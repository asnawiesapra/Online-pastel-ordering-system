import { useState } from 'react'
import { accent, initials } from '../../lib/constants'
import { sizedImage } from '../../lib/images'

const ROUND = {
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  '4xl': 'rounded-4xl',
  full: 'rounded-full',
}

const SIZES = {
  sm: 'size-9 text-base',
  md: 'size-11 text-xl',
  lg: 'size-14 text-3xl',
  xl: 'size-16 text-4xl',
  '2xl': 'size-20 text-5xl',
}

export function StoreAvatar({
  store,
  size = 'lg',
  rounded = '3xl',
  className = '',
  eager = false,
}) {
  const photo = sizedImage(store?.avatar_url || store?.image_url, 'thumb')
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const a = accent(store?.accent)

  const box = [ROUND[rounded] ?? ROUND['3xl'], SIZES[size] ?? SIZES.lg, className]
    .filter(Boolean)
    .join(' ')

  if (!photo || failed) {
    return (
      <div className={[box, a.bg, 'grid shrink-0 place-items-center'].join(' ')} aria-hidden="true">
        <span>{store?.hero_emoji ?? initials(store?.name) ?? '🥟'}</span>
      </div>
    )
  }

  return (
    <div className={[box, a.bg, 'relative shrink-0 overflow-hidden'].join(' ')}>
      {!loaded && (
        <div className={['skeleton absolute inset-0 opacity-50', a.bg].join(' ')} aria-hidden="true" />
      )}
      <img
        src={photo}
        alt={store?.name ?? ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={[
          'h-full w-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
    </div>
  )
}
