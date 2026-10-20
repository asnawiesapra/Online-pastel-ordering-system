import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../lib/NotificationsContext'
import { timeAgo } from '../../lib/constants'

const ICONS = {
  new_order: '🧾',
  order_status: '🛵',
  store_status: '🏪',
  info: '🔔',
}

function iconFor(type) {
  return ICONS[type] ?? ICONS.info
}

export function NotificationsBell() {
  const { items, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const openItem = (n) => {
    if (!n.read_at) markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid size-10 place-items-center rounded-full border border-ink/12 bg-white text-lg transition hover:border-ink/30"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-pop overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
            <span className="font-display text-sm font-bold">Notifications</span>
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Mark all read
                </button>
                <span className="text-ink/20">·</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-3xl bg-canvas-2 text-2xl">
                🔔
              </div>
              <p className="text-sm font-semibold">You’re all caught up</p>
              <p className="mt-1 text-xs text-ink-muted">
                Order updates and store news show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={[
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ink/5',
                      n.read_at ? '' : 'bg-sky/25',
                    ].join(' ')}
                  >
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl bg-canvas-2 text-lg">
                      {iconFor(n.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{n.title}</span>
                        {!n.read_at && <span className="size-2 shrink-0 rounded-full bg-rose-600" />}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block line-clamp-2 text-xs text-ink-muted">{n.body}</span>
                      )}
                      <span className="mt-1 block text-[11px] text-ink-muted">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
