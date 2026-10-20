import { useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { CartDrawer } from './components/layout/CartDrawer'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { isSupabaseConfigured } from './lib/supabase'

import Landing from './pages/client/Landing'
import StoresPage from './pages/client/StoresPage'
import StoreDetail from './pages/client/StoreDetail'
import MapPage from './pages/client/MapPage'
import CartPage from './pages/client/CartPage'
import CheckoutPage from './pages/client/CheckoutPage'
import OrdersPage from './pages/client/OrdersPage'
import OrderDetail from './pages/client/OrderDetail'
import ProfilePage from './pages/client/ProfilePage'
import NotFound from './pages/client/NotFound'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import BecomeStore from './pages/auth/BecomeStore'

import StoreDashboard from './pages/store/StoreDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-4xl bg-ink text-4xl text-white">
            🥟
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Connect Supabase to begin</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Create a <code className="rounded bg-canvas-2 px-1.5 py-0.5 font-mono text-xs">.env</code> file
            with <strong>VITE_SUPABASE_URL</strong> and{' '}
            <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong>, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <main key={location.pathname} className="flex-1 animate-rise">
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/store/:slug" element={<StoreDetail />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/cart" element={<CartPage onOpenCart={() => setCartOpen(true)} />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/become-a-store" element={<BecomeStore />} />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute allow={['store', 'admin']}>
                <StoreDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allow={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
