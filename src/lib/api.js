import { supabase } from './supabase'

export async function fetchStores({ includeAll = false, barangay = '', search = '' } = {}) {
  let query = supabase.from('stores').select('*').order('rating', { ascending: false })
  if (!includeAll) query = query.eq('status', 'approved')
  if (barangay) query = query.eq('barangay', barangay)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchStoreBySlug(slug) {
  const { data, error } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchStoreMenu(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug, emoji, sort_order)')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, store:stores(id, name, slug, accent, hero_emoji), items:order_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchOrder(id) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, store:stores(id, name, slug, accent, hero_emoji, address, barangay, phone, prep_minutes, lat, lng), items:order_items(*), history:order_status_history(*, actor:profiles(full_name))',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function placeOrder(payload) {
  const { data, error } = await supabase.rpc('place_order', payload)
  if (error) throw error
  return data
}

export async function cancelOrder(orderId, reason = '') {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancel_reason: reason })
    .eq('id', orderId)
  if (error) throw error
}

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw error
}

export async function fetchStoreOrders(storeId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:profiles(full_name, phone, email), items:order_items(*)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchMyStore(userId) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createStore(payload) {
  const { data, error } = await supabase.from('stores').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateStore(id, patch) {
  const { data, error } = await supabase.from('stores').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function upsertProduct(payload) {
  const { data, error } = await supabase.from('products').upsert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function adminStats() {
  const [stores, orders, users] = await Promise.all([
    supabase.from('stores').select('id, status', { count: 'exact' }),
    supabase.from('orders').select('id, status, total', { count: 'exact' }),
    supabase.from('profiles').select('id, role', { count: 'exact' }),
  ])
  const orderRows = orders.data ?? []
  return {
    storeCount: stores.count ?? 0,
    pendingStores: (stores.data ?? []).filter((s) => s.status === 'pending').length,
    orderCount: orders.count ?? 0,
    revenue: orderRows
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    userCount: users.count ?? 0,
    storeOwners: (users.data ?? []).filter((u) => u.role === 'store').length,
  }
}
