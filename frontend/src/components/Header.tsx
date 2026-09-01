import { Link, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  Home,
  Package,
  Search,
  MessageCircle,
  User,
  Menu,
  X,
  BarChart3,
  Activity,
  Scale,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCartCount } from '../utils/cartStorage'
import { getCompareCount } from '../utils/compareStorage'
import { AuthModal } from './AuthModal'

interface HeaderProps {
  userRole?: 'customer' | 'merchant'
}

export const Header: React.FC<HeaderProps> = ({
  userRole = 'customer',
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [compareCount, setCompareCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)

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

  const isActive = (path: string) =>
    location.pathname === path

  const customerLinks = [
    {
      path: '/',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/shop',
      label: 'Shop',
      icon: Search,
    },
    {
      path: '/products',
      label: 'Products',
      icon: Package,
    },
    {
      path: '/support',
      label: 'AI Assistant',
      icon: MessageCircle,
    },
  ]

  const merchantLinks = [
    {
      path: '/merchant/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      path: '/merchant/catalog',
      label: 'Catalog',
      icon: Package,
    },
    {
      path: '/merchant/orders',
      label: 'Orders',
      icon: ShoppingCart,
    },
    {
      path: '/merchant/audit-trail',
      label: 'Audit Trail',
      icon: Activity,
    },
  ]

  const links =
    userRole === 'merchant'
      ? merchantLinks
      : customerLinks

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                R
              </span>
            </div>

            <span className="hidden sm:inline text-lg font-bold text-gray-900">
              RazorCart AI
            </span>
          </Link>

          {/* Navigation */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {links.map(
              ({
                path,
                label,
                icon: Icon,
              }) => (
                <Link
                  key={path + label}
                  to={path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(path)
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />

                  <span className="hidden lg:inline text-sm">
                    {label}
                  </span>

                  {/* Compare Count */}
                  {path === '/compare' &&
                    compareCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                        {compareCount}
                      </span>
                    )}
                </Link>
              )
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">

            {userRole === 'customer' && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/compare"
                  className="relative p-1"
                  title="Compare Products"
                  aria-label={`Compare (${compareCount})`}
                >
                  <Scale
                    size={24}
                    className="text-gray-600 hover:text-purple-600"
                  />

                  {compareCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
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
                  <ShoppingCart
                    size={24}
                    className="text-gray-600 hover:text-blue-600"
                  />

                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Login/User */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  {user.icon}
                </div>

                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                </div>

                <button
                  onClick={logout}
                  className="ml-2 text-xs text-red-600 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <User size={18} />

                <span className="hidden lg:inline text-sm">
                  Login
                </span>
              </button>
            )}

            <AuthModal
              open={showAuthModal}
              mode="login"
              onClose={() => setShowAuthModal(false)}
            />

            {/* Mobile Menu */}
            <button
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
              className="md:hidden text-gray-600"
            >
              {menuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-200 py-4 space-y-1">

            {links.map(
              ({
                path,
                label,
                icon: Icon,
              }) => (
                <Link
                  key={path + label}
                  to={path}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={`relative flex items-center justify-between px-4 py-3 rounded-lg ${
                    isActive(path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    {label}
                  </div>

                  {path === '/compare' &&
                    compareCount > 0 && (
                      <span className="bg-purple-600 text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 flex items-center justify-center">
                        {compareCount}
                      </span>
                    )}
                </Link>
              )
            )}

            {userRole === 'customer' && (
              <div className="flex gap-3 px-4 pt-3 border-t border-gray-200">

                <Link
                  to="/compare"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg"
                >
                  <Scale size={18} />
                  Compare
                  {compareCount > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full px-2">
                      {compareCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg"
                >
                  <ShoppingCart size={18} />
                  Cart
                  {cartCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2">
                      {cartCount}
                    </span>
                  )}
                </Link>

              </div>
            )}

          </nav>
        )}
      </div>
    </header>
  )
}
