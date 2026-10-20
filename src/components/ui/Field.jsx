export function Input({ label, hint, error, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <label htmlFor={inputId} className={['block', className].join(' ')}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold tracking-tight text-ink">{label}</span>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-ink/15',
          error ? 'border-red-400' : 'border-ink/15 focus:border-ink/40',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export function Textarea({ label, hint, error, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <label htmlFor={inputId} className={['block', className].join(' ')}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold tracking-tight text-ink">{label}</span>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full resize-y rounded-2xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-ink/15',
          error ? 'border-red-400' : 'border-ink/15 focus:border-ink/40',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export function Select({ label, error, className = '', id, children, ...props }) {
  const inputId = id || props.name
  return (
    <label htmlFor={inputId} className={['block', className].join(' ')}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold tracking-tight text-ink">{label}</span>
      )}
      <select
        id={inputId}
        className={[
          'w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-sm text-ink',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%230a0a0a\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat pr-10',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-ink/15',
          error ? 'border-red-400' : 'border-ink/15 focus:border-ink/40',
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
