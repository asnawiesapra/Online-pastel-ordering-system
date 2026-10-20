import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.warn(
    '[Pater Iligan] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env and fill in your project credentials.',
  )
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const isSupabaseConfigured = Boolean(url && key)
