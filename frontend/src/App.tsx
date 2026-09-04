import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { Header, RequireAuth, ToastContainer } from './components'
import {
  AuditTrailPage,
  CartPage,
  CheckoutPage,
  ComparePage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  MerchantCatalog,
  MerchantDashboard,
  MerchantOrders,
  OrderConfirmationPage,
  OrdersPage,
  ProfilePage,
  ProductDetailsPage,
  ProductsPage,
  ResetPasswordPage,
  SignupPage,
  SupportPage,
} from './pages'
import { ShopPage } from './pages/ShopPage'

function AppContent() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <ToastContainer />

      <Header />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <OrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={<OrderConfirmationPage />}
          />
          <Route path="/support" element={<SupportPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/merchant/catalog" element={<MerchantCatalog />} />
          <Route path="/merchant/orders" element={<MerchantOrders />} />
          <Route path="/merchant/audit-trail" element={<AuditTrailPage />} />

          <Route
            path="*"
            element={
              <div className="flex min-h-[60vh] items-center justify-center px-4">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-3 text-lg font-bold text-white">RazorCart AI</h3>

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
                <a href="/orders" className="block hover:text-white">
                  Orders
                </a>
                <a href="/profile" className="block hover:text-white">
                  Profile
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
            Copyright 2026 RazorCart AI. All rights reserved.
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

