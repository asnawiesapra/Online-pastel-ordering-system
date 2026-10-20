import { useState } from 'react'
import { accent } from '../../lib/constants'

export function SmartImage({
  src,
  alt = '',
  emoji = '🥟',
  accentName = 'mint',
  ratio = 'square',
  className = '',
  imgClassName = '',
  eager = false,
}) {
  const [status, setStatus] = useState(src ? 'loading' : 'fallback')
  const a = accent(accentName)

  const ratios = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[16/10]',
    tall: 'aspect-[4/5]',
    auto: '',
  }

  if (status === 'fallback' || !src) {
    return (
      <div
        className={[
          'grid place-items-center',
          ratios[ratio],
          a.bg,
          className,
        ].join(' ')}
      >
        <span className={ratio === 'auto' ? 'text-3xl' : 'text-4xl'} aria-hidden="true">
          {emoji}
        </span>
      </div>
    )
  }

  return (
    <div className={['relative overflow-hidden bg-canvas-2', ratios[ratio], className].join(' ')}>
      {status === 'loading' && (
        <div className={['skeleton absolute inset-0', a.bg, 'opacity-40'].join(' ')} aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('fallback')}
        className={[
          'h-full w-full object-cover transition-all duration-500',
          status === 'loaded' ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          imgClassName,
        ].join(' ')}
      />
    </div>
  )
}
