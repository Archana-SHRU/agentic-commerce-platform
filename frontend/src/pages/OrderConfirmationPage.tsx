import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'

import { BackendOrder, getOrder } from '../services/orderService'

type LocationState = {
  paymentId?: string
  razorpayOrderId?: string
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const currency = (value: number | string) => currencyFormatter.format(Number(value))

const formatDateTime = (value?: string | null) => {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const StatusPill: React.FC<{
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}> = ({ label, tone }) => {
  const toneClass = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[tone]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${toneClass}`}
    >
      {label}
    </span>
  )
}

const paymentTone = (status: string) => {
  if (status === 'successful') return 'success' as const
  if (status === 'failed') return 'danger' as const
  if (status === 'processing' || status === 'pending') return 'warning' as const
  return 'neutral' as const
}

const orderTone = (status: string) => {
  if (status === 'delivered' || status === 'confirmed') return 'success' as const
  if (status === 'cancelled') return 'danger' as const
  return 'warning' as const
}

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const navigationState = (location.state as LocationState | null) || {}

  const [order, setOrder] = useState<BackendOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrder = useCallback(async () => {
    const numericId = Number(orderId)

    if (!orderId || Number.isNaN(numericId)) {
      setError('That order reference is not valid.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      setOrder(await getOrder(numericId))
    } catch {
      setError(
        'We could not load this order. It may not exist, or the backend may be unavailable.'
      )
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void loadOrder()
  }, [loadOrder])

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Clock size={22} className="animate-spin" />
          Loading your order...
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={30} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Order not available</h1>
          <p className="mt-3 text-slate-600">{error}</p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => void loadOrder()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Try again
            </button>

            <Link
              to="/products"
              className="block w-full rounded-2xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Continue Shopping
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
            >
              <ArrowLeft size={14} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isVerified = Boolean(order.payment_verified)
  const paymentId = order.razorpay_payment_id || navigationState.paymentId || null
  const razorpayOrderId =
    order.razorpay_order_id || navigationState.razorpayOrderId || null
  const createdAt = formatDateTime(order.created_at)
  const paymentFailed = order.payment_status === 'failed'

  const itemsTotal = order.items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl">
          <div
            className={`px-8 py-10 text-center ${
              isVerified
                ? 'bg-gradient-to-br from-emerald-50 to-white'
                : paymentFailed
                  ? 'bg-gradient-to-br from-rose-50 to-white'
                  : 'bg-gradient-to-br from-amber-50 to-white'
            }`}
          >
            <div className="mb-6 flex justify-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-600'
                    : paymentFailed
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-amber-100 text-amber-600'
                }`}
              >
                {isVerified ? (
                  <CheckCircle size={32} />
                ) : paymentFailed ? (
                  <AlertCircle size={32} />
                ) : (
                  <ShieldAlert size={32} />
                )}
              </div>
            </div>

            <p
              className={`mb-2 text-sm font-semibold tracking-[0.2em] ${
                isVerified
                  ? 'text-emerald-600'
                  : paymentFailed
                    ? 'text-rose-600'
                    : 'text-amber-700'
              }`}
            >
              {isVerified
                ? 'ORDER CONFIRMED'
                : paymentFailed
                  ? 'PAYMENT FAILED'
                  : 'ORDER PLACED - PAYMENT NOT VERIFIED'}
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              {isVerified
                ? 'Thank you for your order'
                : paymentFailed
                  ? 'We could not confirm your payment'
                  : 'Your order was created'}
            </h1>

            <p className="mt-2 text-sm text-slate-500">Order ID</p>
            <p className="font-mono text-2xl font-bold text-slate-900">#{order.id}</p>

            {createdAt && <p className="mt-2 text-sm text-slate-500">Placed {createdAt}</p>}
          </div>

          <div className="border-t border-slate-200 px-8 py-6">
            {isVerified ? (
              <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                <ShieldCheck size={20} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Razorpay payment verified by the backend</p>
                  <p className="mt-1">
                    The payment signature was checked server-side against your Razorpay
                    secret and matched.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    {paymentFailed
                      ? 'Payment signature verification failed'
                      : 'Payment not verified'}
                  </p>
                  <p className="mt-1">
                    {paymentFailed
                      ? 'This payment was not verified, so the order has not been confirmed. No verified payment is recorded against it.'
                      : 'This order was created but no verified Razorpay payment is recorded against it.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 border-t border-slate-200 px-8 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Order status
              </p>
              <div className="mt-2">
                <StatusPill label={order.status} tone={orderTone(order.status)} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Payment status
              </p>
              <div className="mt-2">
                <StatusPill
                  label={order.payment_status}
                  tone={paymentTone(order.payment_status)}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Payment verification
              </p>
              <div className="mt-2">
                <StatusPill
                  label={isVerified ? 'Verified' : 'Not verified'}
                  tone={isVerified ? 'success' : 'warning'}
                />
              </div>
            </div>

            {paymentId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Payment ID
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                  {paymentId}
                </p>
              </div>
            )}

            {razorpayOrderId && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Razorpay order ID
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                  {razorpayOrderId}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Order items</h2>
              <p className="text-sm text-slate-500">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {item.product_name || `Product #${item.product_id}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Qty {item.quantity} x {currency(item.unit_price)} each
                  </p>
                </div>

                <p className="whitespace-nowrap font-semibold text-slate-900">
                  {currency(Number(item.unit_price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Items subtotal</span>
              <span className="font-medium text-slate-900">{currency(itemsTotal)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-base font-bold text-slate-900">Order total</span>
              <span className="text-2xl font-bold text-blue-600">
                {currency(order.total_amount)}
              </span>
            </div>
          </div>

          {order.customer_id && (
            <p className="mt-4 text-sm text-slate-500">
              Customer: <span className="text-slate-800">{order.customer_id}</span>
            </p>
          )}
        </section>

        <section className="mt-6 space-y-3">
          <Link
            to="/orders"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700"
          >
            <ShoppingBag size={18} />
            Back to Orders
          </Link>

          <Link
            to="/products"
            className="block w-full rounded-2xl bg-white px-6 py-4 text-center font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Continue Shopping
          </Link>
        </section>
      </div>
    </div>
  )
}

export default OrderConfirmationPage

