import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [myStore, setMyStore] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setMyStore(null)
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('[auth] profile load failed', error.message)
      setProfile(null)
      setMyStore(null)
      return null
    }
    setProfile(data ?? null)

    // Store owners get their store (for "My store" nav link + avatar).
    if (data?.role === 'store') {
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle()
      setMyStore(store ?? null)
    } else {
      setMyStore(null)
    }
    return data ?? null
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        await loadProfile(data.session.user.id)
      }
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        await loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async ({ email, password, fullName, phone, role = 'client', address, barangay }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role, address, barangay },
      },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const updateProfile = useCallback(
    async (patch) => {
      if (!session?.user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id)
        .select()
        .single()
      if (error) throw error
      setProfile(data)
      return data
    },
    [session],
  )

  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session])

  const uploadAvatar = useCallback(
    async (file) => {
      if (!session?.user) throw new Error('Not signed in')
      if (!file) return null
      if (file.size > 2 * 1024 * 1024) throw new Error('Image must be 2 MB or smaller.')
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl
    },
    [session],
  )

  const uploadImage = useCallback(
    async (file, { folder = 'misc' } = {}) => {
      if (!session?.user) throw new Error('Not signed in')
      if (!file) return null
      if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.')
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${session.user.id}/${folder}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (error) throw error
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      return data.publicUrl
    },
    [session],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      myStore,
      setMyStore,
      role: profile?.role ?? null,
      isAdmin: profile?.role === 'admin',
      isStore: profile?.role === 'store',
      isClient: profile?.role === 'client',
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      uploadAvatar,
      uploadImage,
      refreshProfile,
    }),
    [session, profile, myStore, loading, signUp, signIn, signOut, updateProfile, uploadAvatar, uploadImage, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
