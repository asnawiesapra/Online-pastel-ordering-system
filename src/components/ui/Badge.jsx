import { accent } from '../../lib/constants'
import { ORDER_STATUS } from '../../lib/constants'

export function Badge({ children, tone = 'neutral', className = '' }) {
  const a = accent(tone)
  const styles = {
    neutral: 'border-ink/12 bg-canvas-2 text-ink-soft',
    ink: 'border-ink bg-ink text-white',
  }
  const usePastel = !['neutral', 'ink'].includes(tone)
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight',
        usePastel ? `${a.bg} ${a.text} border-transparent` : styles[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status, className = '' }) {
  const meta = ORDER_STATUS[status] ?? { label: status, tone: 'neutral' }
  return (
    <Badge tone={meta.tone} className={className}>
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {meta.label}
    </Badge>
  )
}
