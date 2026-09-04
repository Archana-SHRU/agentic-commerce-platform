import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronRight, ShieldCheck, ShoppingBag } from 'lucide-react'

import { PaymentStatusComponent } from '../components/PaymentStatusComponent'
import { useAuth } from '../context/AuthContext'
import { PaymentStatus, CartItem } from '../types'
import { clearCart, getCartItems } from '../utils/cartStorage'
import { recordAuditEvent } from '../utils/auditStorage'
import { showToast } from '../utils/toastBus'

import { createOrder, BackendOrder } from '../services/orderService'

type ShippingForm = {
  firstname: string
  lastname: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  paymentMethod: 'card' | 'upi' | 'wallet'
}

const initialForm: ShippingForm = {
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  paymentMethod: 'upi',
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ShippingForm>(initialForm)

  useEffect(() => {
    const updateCart = () => {
      setCartItems(getCartItems())
    }

    updateCart()
    window.addEventListener('cart-updated', updateCart)

    return () => {
      window.removeEventListener('cart-updated', updateCart)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    setFormData((previous) => {
      const parts = user.name.trim().split(/\s+/)

      return {
        ...previous,
        firstname: previous.firstname || parts[0] || '',
        lastname: previous.lastname || parts.slice(1).join(' ') || '',
        email: previous.email || user.email,
      }
    })
  }, [user])

  const { subtotal, discount, tax, totalAmount } = useMemo(() => {
    const subtotalValue = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
    const discountValue = Math.floor(subtotalValue * 0.05)
    const taxableAmount = Math.max(0, subtotalValue - discountValue)
    const taxValue = Math.floor(taxableAmount * 0.18)

    return {
      subtotal: subtotalValue,
      discount: discountValue,
      tax: taxValue,
      totalAmount: taxableAmount + taxValue,
    }
  }, [cartItems])

  const validateForm = () => {
    const requiredFields: Array<keyof ShippingForm> = [
      'firstname',
      'lastname',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'pincode',
    ]

    const hasMissingField = requiredFields.some((field) => !formData[field].trim())

    if (hasMissingField) {
      showToast('Please fill in all shipping details.', 'error')
      return false
    }

    return true
  }

  const handlePayNow = async () => {
    if (!validateForm()) return

    if (cartItems.length === 0) {
      showToast('Your cart is empty.', 'error')
      return
    }

    let backendOrder: BackendOrder | null = null

    setIsSubmitting(true)

    try {
      backendOrder = await createOrder({
        customer_id: user?.email ?? formData.email.trim(),
        items: cartItems.map((item) => ({
          product_id: Number(item.productId),
          quantity: item.quantity,
        })),
      })

      recordAuditEvent({
        type: 'order',
        description: `Order #${backendOrder.id} created successfully`,
        actor: 'customer',
        status: 'pending',
        metadata: {
          backendOrderId: backendOrder.id,
          amount: backendOrder.total_amount,
          items: cartItems.length,
          customer: user?.email ?? formData.email.trim(),
        },
      })

      setPaymentStatus({
        orderId: String(backendOrder.id),
        status: 'processing',
        amount: totalAmount,
        timestamp: new Date(),
        verified: false,
      })

      const result = await startRazorpayCheckout({
        amount: totalAmount,
        currency: 'INR',
        items: cartItems,
        customer: {
          name: `${formData.firstname} ${formData.lastname}`.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        backendOrderId: backendOrder.id,
        notes: {
          backendOrderId: String(backendOrder.id),
          customerId: user?.email ?? formData.email.trim(),
          customerName: `${formData.firstname} ${formData.lastname}`.trim(),
          paymentMethod: formData.paymentMethod,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          address: formData.address,
        },
      })

      if (result.status === 'success') {
        setPaymentStatus({
          orderId: String(backendOrder.id),
          status: 'successful',
          amount: result.amount,
          timestamp: new Date(),
          transactionId: result.paymentId,
          verified: true,
        })

        recordAuditEvent({
          type: 'payment',
          description: `Payment verified for Order #${backendOrder.id}`,
          actor: 'system',
          status: 'success',
          metadata: {
            backendOrderId: backendOrder.id,
            paymentId: result.paymentId,
            amount: result.amount,
            verified: true,
          },
        })

        clearCart()
        setCartItems([])

        showToast(`Order #${backendOrder.id} placed successfully!`, 'success')

        navigate(`/order-confirmation/${backendOrder.id}`, {
          state: {
            paymentId: result.paymentId,
            razorpayOrderId: result.orderId,
          },
        })
        return
      }

      setPaymentStatus({
        orderId: String(backendOrder.id),
        status: 'failed',
        amount: totalAmount,
        timestamp: new Date(),
        errorMessage: result.message,
        verified: false,
      })

      recordAuditEvent({
        type: 'payment',
        description: `Payment failed for Order #${backendOrder.id}`,
        actor: 'system',
        status: 'failed',
        metadata: {
          backendOrderId: backendOrder.id,
          amount: totalAmount,
          message: result.message,
        },
      })

      showToast(result.message, 'error')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create order. Please try again.'

      if (backendOrder) {
        setPaymentStatus({
          orderId: String(backendOrder.id),
          status: 'failed',
          amount: totalAmount,
          timestamp: new Date(),
          errorMessage: message,
          verified: false,
        })

        recordAuditEvent({
          type: 'payment',
          description: `Payment failed for Order #${backendOrder.id}`,
          actor: 'system',
          status: 'failed',
          metadata: {
            backendOrderId: backendOrder.id,
            amount: totalAmount,
            message,
          },
        })
      } else {
        setPaymentStatus(null)
      }

      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (paymentStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <PaymentStatusComponent
            status={paymentStatus}
            onRetry={() => setPaymentStatus(null)}
          />
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <ShoppingBag size={38} className="text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="mt-3 text-slate-500">
            Add some products before checking out.
          </p>

          <button
            type="button"
            onClick={() => navigate('/products')}
            className="mt-8 rounded-2xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Secure checkout
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-3 text-slate-600">
            Secure payment powered by Razorpay.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Shipping details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="First name"
                  value={formData.firstname}
                  onChange={(e) =>
                    setFormData({ ...formData, firstname: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="text"
                  placeholder="Last name"
                  value={formData.lastname}
                  onChange={(e) =>
                    setFormData({ ...formData, lastname: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="text"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="sm:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Payment method
                  </h2>
                  <p className="text-sm text-slate-500">
                    Choose a payment method.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    value: 'upi',
                    label: 'UPI / Razorpay',
                    description: 'Recommended for fast payments.',
                  },
                  {
                    value: 'card',
                    label: 'Credit / Debit card',
                    description: 'Use card payment through Razorpay.',
                  },
                  {
                    value: 'wallet',
                    label: 'Digital wallet',
                    description: 'Wallet payment through Razorpay.',
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition ${
                      formData.paymentMethod === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={formData.paymentMethod === option.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target
                            .value as ShippingForm['paymentMethod'],
                        })
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                <div className="flex gap-3">
                  <AlertCircle
                    size={20}
                    className="mt-0.5 flex-shrink-0 text-blue-600"
                  />

                  <div className="text-sm text-blue-900">
                    <p className="font-semibold">
                      Secure payment powered by Razorpay
                    </p>
                    <p className="mt-1">
                      Your order is created securely before payment processing.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Order summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s) in cart
              </p>

              <div className="mt-6 space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-slate-500">Qty {item.quantity}</p>
                    </div>

                    <p className="font-semibold text-slate-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-emerald-600">
                    -{formatCurrency(discount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">GST (18%)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(tax)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Creating Order...' : `Pay ${formatCurrency(totalAmount)}`}
                <ChevronRight size={18} />
              </button>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Delivery info
              </p>
              <p className="mt-3 text-lg font-semibold">
                Estimated delivery in 2-4 business days.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                We&apos;ll send shipping updates, payment confirmation, and order details
                to your email after checkout.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage

