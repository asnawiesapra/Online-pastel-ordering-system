export function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block size-5 animate-spin rounded-full border-2 border-ink/15 border-t-ink',
        className,
      ].join(' ')}
    />
  )
}

export function Skeleton({ className = '' }) {
  return <div className={['skeleton rounded-2xl', className].join(' ')} />
}

export function EmptyState({ emoji = '🥟', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-ink/15 bg-canvas-2 px-6 py-16 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-white text-3xl shadow-sm">
        {emoji}
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-ink-muted">
        <Spinner />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
}
