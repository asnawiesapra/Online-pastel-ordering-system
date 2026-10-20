import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'pastel-iligan:cart:v1'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.storeId) return null
    return parsed
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => readStored())

  useEffect(() => {
    if (cart) localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    else localStorage.removeItem(STORAGE_KEY)
  }, [cart])

  const clearCart = useCallback(() => setCart(null), [])

  const startCart = useCallback((store) => {
    setCart((prev) => {
      if (prev?.storeId === store.id) return prev
      return {
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        accent: store.accent,
        deliveryFee: Number(store.delivery_fee ?? 0),
        minOrder: Number(store.min_order ?? 0),
        storeLat: store.lat != null ? Number(store.lat) : null,
        storeLng: store.lng != null ? Number(store.lng) : null,
        prepMinutes: Number(store.prep_minutes ?? 20),
        items: [],
      }
    })
  }, [])

  const addItem = useCallback((store, product, quantity = 1) => {
    setCart((prev) => {
      const base =
        prev?.storeId === store.id
          ? prev
          : {
              storeId: store.id,
              storeName: store.name,
              storeSlug: store.slug,
              accent: store.accent,
              deliveryFee: Number(store.delivery_fee ?? 0),
              minOrder: Number(store.min_order ?? 0),
              storeLat: store.lat != null ? Number(store.lat) : null,
              storeLng: store.lng != null ? Number(store.lng) : null,
              prepMinutes: Number(store.prep_minutes ?? 20),
              items: [],
            }
      const existing = base.items.find((i) => i.productId === product.id)
      const items = existing
        ? base.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [
            ...base.items,
            {
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              emoji: product.emoji,
              unit: product.unit,
              quantity,
            },
          ]
      return { ...base, items }
    })
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setCart((prev) => {
      if (!prev) return prev
      const items = prev.items
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0)
      return { ...prev, items }
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setCart((prev) => {
      if (!prev) return prev
      return { ...prev, items: prev.items.filter((i) => i.productId !== productId) }
    })
  }, [])

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  const subtotal = cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0
  const isEmpty = !cart || cart.items.length === 0

  const value = useMemo(
    () => ({
      cart,
      items: cart?.items ?? [],
      itemCount,
      subtotal,
      isEmpty,
      storeId: cart?.storeId ?? null,
      startCart,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [cart, itemCount, subtotal, isEmpty, startCart, addItem, setQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
