import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Clock, Package, ShoppingBag } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { BackendOrder, getOrders } from '../services/orderService'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number | string) =>
  currencyFormatter.format(Number(value))

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const statusBadgeClass = (status: string) => {
  if (status === 'successful' || status === 'confirmed' || status === 'delivered') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (status === 'processing' || status === 'pending') {
    return 'bg-amber-50 text-amber-800 border-amber-200'
  }

  if (status === 'failed' || status === 'cancelled') {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export const OrdersPage: React.FC = () => {
  const { user } = useAuth()

  const [orders, setOrders] = useState<BackendOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadOrders = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await getOrders({
          skip: 0,
          limit: 100,
        })

        if (!cancelled) {
          setOrders(response.items)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load your orders right now.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      cancelled = true
    }
  }, [])

  const customerKeys = useMemo(() => {
    if (!user) return []

    return [
      user.email.trim().toLowerCase(),
      user.name.trim().toLowerCase(),
      String(user.id),
    ]
  }, [user])

  const myOrders = useMemo(() => {
    return [...orders]
      .filter((order) => {
        const customerId = (order.customer_id || '').trim().toLowerCase()
        return customerKeys.includes(customerId)
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }, [customerKeys, orders])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Clock size={22} className="animate-spin" />
          Loading your orders...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={30} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Orders unavailable</h1>
          <p className="mt-3 text-slate-600">{error}</p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowRight size={18} />
              Retry
            </button>

            <Link
              to="/products"
              className="block w-full rounded-2xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Account
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Your orders</h1>
          <p className="mt-3 text-slate-600">
            Review the orders tied to your signed-in account.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Orders found</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{myOrders.length}</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Verified payments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {myOrders.filter((order) => order.payment_verified).length}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Account email</p>
            <p className="mt-2 truncate text-lg font-semibold text-slate-900">
              {user?.email}
            </p>
          </div>
        </div>

        {myOrders.length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ShoppingBag size={30} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">No orders yet</h2>
            <p className="mt-3 text-slate-600">
              When you complete checkout, your verified orders will appear here.
            </p>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Products
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {myOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                        <Package size={20} />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Order
                        </p>
                        <h2 className="text-2xl font-bold text-slate-900">#{order.id}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Placed {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          order.payment_verified
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        {order.payment_verified ? 'Verified' : 'Not verified'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] bg-slate-50 px-5 py-4 lg:min-w-[220px]">
                    <p className="text-sm text-slate-500">Total amount</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <p className="font-medium text-slate-900">
                        {item.product_name || `Product #${item.product_id}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Qty {item.quantity} x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Razorpay order ID:{' '}
                    <span className="font-mono text-slate-700">
                      {order.razorpay_order_id || 'Pending'}
                    </span>
                  </p>

                  <Link
                    to={`/order-confirmation/${order.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    View details
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage


