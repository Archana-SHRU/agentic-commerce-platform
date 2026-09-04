import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  MessageCircle,
  Menu,
  Package,
  Scale,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { getCartCount } from '../utils/cartStorage'
import { getCompareCount } from '../utils/compareStorage'

export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [compareCount, setCompareCount] = useState(0)

  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    const updateCart = () => {
      setCartCount(getCartCount())
    }

    const updateCompare = () => {
      setCompareCount(getCompareCount())
    }

    updateCart()
    updateCompare()

    window.addEventListener('cart-updated', updateCart)
    window.addEventListener('compare-updated', updateCompare)
    window.addEventListener('storage', updateCart)
    window.addEventListener('storage', updateCompare)

    return () => {
      window.removeEventListener('cart-updated', updateCart)
      window.removeEventListener('compare-updated', updateCompare)
      window.removeEventListener('storage', updateCart)
      window.removeEventListener('storage', updateCompare)
    }
  }, [])

  const isActive = (path: string) => location.pathname === path

  const returnPath =
    location.pathname === '/login' || location.pathname === '/signup'
      ? '/'
      : `${location.pathname}${location.search}`

  const customerLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: Search },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/support', label: 'AI Assistant', icon: MessageCircle },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <span className="text-lg font-bold text-white">R</span>
            </div>

            <span className="hidden text-lg font-bold text-gray-900 sm:inline">
              RazorCart AI
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {customerLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                  isActive(path)
                    ? 'bg-blue-50 font-semibold text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="hidden text-sm lg:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-4 md:flex">
              <Link
                to="/compare"
                className="relative p-1"
                title="Compare Products"
                aria-label={`Compare (${compareCount})`}
              >
                <Scale size={24} className="text-gray-600 hover:text-purple-600" />

                {compareCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
                    {compareCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative p-1"
                title="Cart"
                aria-label={`Cart (${cartCount})`}
              >
                <ShoppingCart size={24} className="text-gray-600 hover:text-blue-600" />

                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>

            {user ? (
              <div className="hidden items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {user.icon}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <Link
                      to="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="text-red-600 hover:underline"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/signup"
                  state={{ from: returnPath }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Sign up
                </Link>

                <Link
                  to="/login"
                  state={{ from: returnPath }}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                >
                  Login
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="text-gray-600 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t border-gray-200 py-4 md:hidden">
            {customerLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  isActive(path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </div>
              </Link>
            ))}

            <div className="flex gap-3 border-t border-gray-200 px-4 pt-3">
              <Link
                to="/compare"
                onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-purple-50 px-4 py-3 text-purple-700"
              >
                <Scale size={18} />
                Compare
                {compareCount > 0 && (
                  <span className="rounded-full bg-purple-600 px-2 text-xs text-white">
                    {compareCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-blue-700"
              >
                <ShoppingCart size={18} />
                Cart
                {cartCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 text-xs text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {user ? (
              <div className="grid gap-2 border-t border-gray-200 px-4 pt-3">
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
                >
                  Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                  className="rounded-lg bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid gap-2 border-t border-gray-200 px-4 pt-3">
                <Link
                  to="/signup"
                  state={{ from: returnPath }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700"
                >
                  Sign up
                </Link>

                <Link
                  to="/login"
                  state={{ from: returnPath }}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-700"
                >
                  Login
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

