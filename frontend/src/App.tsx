import { useState } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'

import { Header, ToastContainer } from './components'
import {
  AuditTrailPage,
  CartPage,
  CheckoutPage,
  ComparePage,
  HomePage,
  MerchantCatalog,
  MerchantDashboard,
  MerchantOrders,
  ProductDetailsPage,
  ProductsPage,
  SupportPage,
} from './pages'
import { ShopPage } from './pages/ShopPage'

type UserRole = 'customer' | 'merchant'

function AppContent() {
  const [userRole, setUserRole] = useState<UserRole>('customer')
  const navigate = useNavigate()

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role)

    if (role === 'merchant') {
      navigate('/merchant/dashboard')
      return
    }

    navigate('/')
  }

  const roleBadgeText =
    userRole === 'customer' ? 'Customer View' : 'Merchant View'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer />

      <Header userRole={userRole} />

      <div className="border-b border-amber-200 bg-amber-50/90 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="text-amber-900">
            <span className="font-semibold">{roleBadgeText}</span>
            <span className="ml-2 text-amber-700">
              Demo role switcher for local testing
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleRoleChange('customer')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                userRole === 'customer'
                  ? 'bg-amber-200 text-amber-950'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              Customer
            </button>

            <button
              onClick={() => handleRoleChange('merchant')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                userRole === 'merchant'
                  ? 'bg-amber-200 text-amber-950'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              Merchant
            </button>
          </div>
        </div>
      </div>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/support" element={<SupportPage />} />

          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/merchant/catalog" element={<MerchantCatalog />} />
          <Route path="/merchant/orders" element={<MerchantOrders />} />
          <Route path="/merchant/audit-trail" element={<AuditTrailPage />} />

          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center">
                  <h1 className="mb-3 text-5xl font-bold text-slate-900">
                    404
                  </h1>
                  <p className="mb-6 text-slate-500">Page not found</p>
                  <a
                    href="/"
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="mt-16 bg-slate-950 py-12 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-3 text-lg font-bold text-white">
                RazorCart AI
              </h3>

              <p className="text-sm text-slate-400">
                AI-powered shopping. Razorpay-powered checkout.
              </p>
            </div>

            <div>
              <h4 className="mb-3 font-semibold text-white">Customer</h4>
              <div className="space-y-2 text-sm">
                <a href="/" className="block hover:text-white">
                  Home
                </a>
                <a href="/shop" className="block hover:text-white">
                  Shop
                </a>
                <a href="/products" className="block hover:text-white">
                  Products
                </a>
                <a href="/cart" className="block hover:text-white">
                  Cart
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold text-white">Merchant</h4>
              <div className="space-y-2 text-sm">
                <a href="/merchant/dashboard" className="block hover:text-white">
                  Dashboard
                </a>
                <a href="/merchant/catalog" className="block hover:text-white">
                  Catalog
                </a>
                <a href="/merchant/orders" className="block hover:text-white">
                  Orders
                </a>
                <a href="/merchant/audit-trail" className="block hover:text-white">
                  Audit Trail
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold text-white">
                RazorCart AI Platform
              </h4>

              <p className="text-sm text-slate-400">
                Production-ready commerce demo for the Razorpay ecosystem.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Built for the Razorpay Buildathon
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
            © 2026 RazorCart AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
