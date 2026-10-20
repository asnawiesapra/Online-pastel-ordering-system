export const ACCENTS = {
  mint: { bg: 'bg-mint', deep: 'bg-mint-deep', text: 'text-emerald-900', ring: 'ring-mint-deep', hex: '#cdeee0' },
  peach: { bg: 'bg-peach', deep: 'bg-peach-deep', text: 'text-orange-900', ring: 'ring-peach-deep', hex: '#ffe0d1' },
  lilac: { bg: 'bg-lilac', deep: 'bg-lilac-deep', text: 'text-violet-900', ring: 'ring-lilac-deep', hex: '#e4dcfb' },
  butter: { bg: 'bg-butter', deep: 'bg-butter-deep', text: 'text-yellow-900', ring: 'ring-butter-deep', hex: '#fdf0c4' },
  blush: { bg: 'bg-blush', deep: 'bg-blush-deep', text: 'text-pink-900', ring: 'ring-blush-deep', hex: '#fcdce6' },
  sky: { bg: 'bg-sky', deep: 'bg-sky-deep', text: 'text-sky-900', ring: 'ring-sky-deep', hex: '#d6ecfb' },
}

export const ACCENT_KEYS = Object.keys(ACCENTS)

export function accent(name) {
  return ACCENTS[name] ?? ACCENTS.mint
}

export const ORDER_STATUS = {
  pending: { label: 'Pending', tone: 'butter', step: 1, hint: 'Waiting for the store to confirm.' },
  accepted: { label: 'Accepted', tone: 'sky', step: 2, hint: 'The store confirmed your order.' },
  preparing: { label: 'Preparing', tone: 'lilac', step: 3, hint: 'Your food is being cooked.' },
  ready: { label: 'Ready', tone: 'mint', step: 4, hint: 'Ready for pickup.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'peach', step: 5, hint: 'On the way to you.' },
  completed: { label: 'Completed', tone: 'mint', step: 6, hint: 'Order completed. Salamat!' },
  cancelled: { label: 'Cancelled', tone: 'blush', step: 0, hint: 'This order was cancelled.' },
}

export const STATUS_FLOW = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed']

export function nextStatuses(status, fulfillment) {
  switch (status) {
    case 'pending':
      return ['accepted', 'cancelled']
    case 'accepted':
      return ['preparing', 'cancelled']
    case 'preparing':
      return fulfillment === 'delivery' ? ['ready', 'out_for_delivery'] : ['ready']
    case 'ready':
      return fulfillment === 'delivery' ? ['out_for_delivery', 'completed'] : ['completed']
    case 'out_for_delivery':
      return ['completed']
    default:
      return []
  }
}

export const ILIGAN_BARANGAYS = [
  'Abuno',
  'Acmac-Mariano Badelles Sr.',
  'Bagong Silang',
  'Bonbonon',
  'Bunawan',
  'Buru-un',
  'Dalipuga',
  'Del Carmen',
  'Digkilaan',
  'Ditucalan',
  'Dulag',
  'Hinaplanon',
  'Hindang',
  'Kabacsanan',
  'Kalilangan',
  'Kiwalan',
  'Lanipao',
  'Luinab',
  'Mahayahay',
  'Mainit',
  'Mandulog',
  'Maria Cristina',
  'Pala-o',
  'Panoroganan',
  'Poblacion',
  'Puga-an',
  'Rogongon',
  'San Miguel',
  'San Roque',
  'Santa Elena',
  'Santa Filomena',
  'Santiago',
  'Santo Rosario',
  'Saray',
  'Suarez',
  'Tambacan',
  'Tibanga',
  'Tipanoy',
  'Tomas L. Cabili',
  'Tubod',
  'Ubaldo Laya',
  'Upper Hinaplanon',
  'Upper Tominobo',
  'Villa Verde',
]

export const CURRENCY = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
})

export function peso(value) {
  const n = Number(value ?? 0)
  return CURRENCY.format(Number.isFinite(n) ? n : 0)
}

export function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
