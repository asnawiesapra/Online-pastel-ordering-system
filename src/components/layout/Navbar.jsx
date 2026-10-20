import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { useCart } from '../../lib/CartContext'
import { initials } from '../../lib/constants'
import { Button } from '../ui/Button'
import { NotificationsBell } from './NotificationsBell'

const navLinks = [
  { to: '/stores', label: 'Stores' },
  { to: '/map', label: 'Map' },
  { to: '/orders', label: 'My Orders' },
]

export function Navbar({ onOpenCart }) {
  const { user, profile, isAdmin, isStore, myStore, signOut } = useAuth()
  const { itemCount } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenu(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const dashboardPath = isAdmin ? '/admin' : isStore ? '/dashboard' : '/orders'

  return (
    <header
      className={[
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'border-ink/10 bg-white/85 backdrop-blur-xl'
          : 'border-transparent bg-white/0',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-2xl bg-ink text-base text-white">
            🥟
          </span>
          <span className="hidden sm:block">
            Pater<span className="text-ink-muted">Iligan</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-ink/5 text-ink' : 'text-ink-muted hover:text-ink',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user && <NotificationsBell />}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Open cart"
            className="relative grid size-10 place-items-center rounded-full border border-ink/12 bg-white text-lg transition hover:border-ink/30"
          >
            🛒
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-ink/12 bg-white py-1 pl-1 pr-3 transition hover:border-ink/30"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Account'}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                    {initials(profile?.full_name || user.email)}
                  </span>
                )}
                <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
                  {profile?.full_name?.split(' ')[0] || 'Account'}
                </span>
              </button>

              {userMenu && (
                <div className="absolute right-0 mt-2 w-52 animate-pop overflow-hidden rounded-3xl border border-ink/10 bg-white p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="size-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                        {initials(profile?.full_name || user.email)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{profile?.full_name || 'Guest'}</p>
                      <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-ink/8" />
                  <Link to="/profile" className="block rounded-2xl px-3 py-2 text-sm font-medium hover:bg-ink/5">
                    My profile
                  </Link>
                  <Link to={dashboardPath} className="block rounded-2xl px-3 py-2 text-sm font-medium hover:bg-ink/5">
                    {isAdmin ? 'Admin console' : isStore ? 'Store dashboard' : 'My orders'}
                  </Link>
                  {isStore && myStore && (
                    <Link
                      to={`/store/${myStore.slug}`}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-ink/5"
                    >
                      My store
                      <span
                        className={[
                          'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
                          myStore.status === 'approved'
                            ? 'bg-mint text-emerald-900'
                            : 'bg-butter text-amber-900',
                        ].join(' ')}
                      >
                        {myStore.status === 'approved' ? 'Live' : 'Pending'}
                      </span>
                    </Link>
                  )}
                  {!isStore && !isAdmin && (
                    <Link to="/become-a-store" className="block rounded-2xl px-3 py-2 text-sm font-medium hover:bg-ink/5">
                      Open a store
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Order now
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="grid size-10 place-items-center rounded-full border border-ink/12 bg-white md:hidden"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-rise border-t border-ink/10 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    'rounded-2xl px-4 py-3 text-sm font-medium',
                    isActive ? 'bg-ink/5' : 'hover:bg-ink/5',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    [
                      'rounded-2xl px-4 py-3 text-sm font-medium',
                      isActive ? 'bg-ink/5' : 'hover:bg-ink/5',
                    ].join(' ')
                  }
                >
                  My profile
                </NavLink>
                {isStore && myStore && (
                  <NavLink
                    to={`/store/${myStore.slug}`}
                    className={({ isActive }) =>
                      [
                        'rounded-2xl px-4 py-3 text-sm font-medium',
                        isActive ? 'bg-ink/5' : 'hover:bg-ink/5',
                      ].join(' ')
                    }
                  >
                    My store
                  </NavLink>
                )}
              </>
            ) : null}
            {!user && (
              <div className="mt-2 flex gap-2">
                <Button as={Link} to="/login" variant="outline" className="flex-1">
                  Sign in
                </Button>
                <Button as={Link} to="/register" className="flex-1">
                  Order now
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
