import { useRef, useState } from 'react'
import { Button } from './Button'

export function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'misc',
  aspect = 'video',
  emoji = '🖼️',
  round = false,
  upload,
  hint = 'JPG, PNG or WebP · up to 5 MB',
  className = '',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const ratios = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[16/9]',
  }

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await upload(file, { folder })
      if (url) onChange(url)
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={['block', className].join(' ')}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold tracking-tight text-ink">{label}</span>
      )}

      <div
        className={[
          'relative flex items-center justify-center overflow-hidden border-2 border-dashed border-ink/15 bg-canvas-2',
          round ? 'rounded-full' : 'rounded-3xl',
          round ? 'size-24' : ratios[aspect] ?? ratios.video,
        ].join(' ')}
      >
        {value ? (
          <img src={value} alt={label ?? ''} className="h-full w-full object-cover" />
        ) : (
          <span className={round ? 'text-2xl' : 'text-4xl'} aria-hidden="true">
            {emoji}
          </span>
        )}

        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-semibold">
            Uploading…
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {value ? 'Replace photo' : 'Upload photo'}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')} disabled={uploading}>
            Remove
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={onPick}
          className="hidden"
        />
      </div>

      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </div>
  )
}
