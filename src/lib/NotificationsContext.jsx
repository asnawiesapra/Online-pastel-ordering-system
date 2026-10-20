import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) {
      console.error('[notifications] load failed', error.message)
      setItems([])
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    load()
  }, [load])

  // Realtime: prepend new notifications as they arrive.
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => [payload.new, ...prev.filter((n) => n.id !== payload.new.id)].slice(0, 50))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const unreadCount = useMemo(() => items.filter((n) => !n.read_at).length, [items])

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)))
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('[notifications] mark read failed', error.message)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user?.id) return
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null)
    if (error) console.error('[notifications] mark all read failed', error.message)
  }, [user?.id])

  const clearAll = useCallback(async () => {
    if (!user?.id) return
    setItems([])
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)
    if (error) console.error('[notifications] clear failed', error.message)
  }, [user?.id])

  const value = useMemo(
    () => ({ items, unreadCount, loading, markRead, markAllRead, clearAll, refresh: load }),
    [items, unreadCount, loading, markRead, markAllRead, clearAll, load],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}
