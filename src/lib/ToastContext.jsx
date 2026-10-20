import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, { tone = 'ink', duration = 3200 } = {}) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, tone }])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (m) => push(m, { tone: 'mint' }),
      error: (m) => push(m, { tone: 'blush' }),
      info: (m) => push(m, { tone: 'sky' }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={[
              'pointer-events-auto w-full max-w-sm animate-rise rounded-2xl border border-ink/10 px-4 py-3 text-left text-sm font-medium shadow-[0_10px_40px_-12px_rgba(0,0,0,0.35)]',
              t.tone === 'mint' ? 'bg-mint' : '',
              t.tone === 'blush' ? 'bg-blush' : '',
              t.tone === 'sky' ? 'bg-sky' : '',
              t.tone === 'ink' ? 'bg-ink text-white' : 'text-ink',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
