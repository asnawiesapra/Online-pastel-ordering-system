import { accent } from '../../lib/constants'

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  accent: accentName,
  className = '',
  children,
  ...props
}) {
  const sizes = {
    sm: 'h-9 px-3.5 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-13 px-7 text-base',
  }
  const a = accentName ? accent(accentName) : null
  const variants = {
    primary: 'bg-ink text-white hover:bg-ink-soft active:scale-[0.98]',
    outline: 'border border-ink/15 bg-white text-ink hover:border-ink/40 hover:bg-canvas-2',
    ghost: 'text-ink hover:bg-ink/5',
    pastel: a ? `${a.bg} ${a.text} hover:brightness-95` : 'bg-mint text-emerald-900',
    danger: 'bg-ink text-white hover:bg-red-600',
  }
  return (
    <Tag
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        sizes[size],
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Tag>
  )
}
