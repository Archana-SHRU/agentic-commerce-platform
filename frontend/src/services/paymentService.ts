import { CartItem } from '../types'

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance
  }
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id?: string
  image?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
  handler?: (response: RazorpaySuccessResponse) => void
}

type RazorpayCheckoutInstance = {
  open: () => void
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_signature?: string
}

export type PaymentFlowResult =
  | {
      status: 'success'
      verified: boolean
      orderId: string
      paymentId?: string
      amount: number
      mode: 'live' | 'demo'
    }
  | {
      status: 'failed'
      verified: false
      orderId: string
      amount: number
      mode: 'live' | 'demo'
      message: string
    }

export type PaymentCustomer = {
  name: string
  email: string
  phone: string
}

type CreateOrderResponse = {
  id: string
  amount: number
  currency?: string
}

type VerifyPaymentResponse = {
  verified?: boolean
}

function getApiUrl() {
  return import.meta.env.VITE_API_URL?.trim() || ''
}

function getKeyId() {
  return import.meta.env.VITE_RAZORPAY_KEY_ID?.trim() || ''
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

async function createOrder(payload: {
  amount: number
  currency: string
  items: CartItem[]
  customer: PaymentCustomer
}): Promise<CreateOrderResponse | null> {
  const apiUrl = getApiUrl()
  if (!apiUrl) return null

  try {
    const response = await fetch(`${apiUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) return null

    return (await response.json()) as CreateOrderResponse
  } catch {
    return null
  }
}

async function verifyPayment(payload: {
  paymentId: string
  orderId: string
  signature?: string
}): Promise<boolean> {
  const apiUrl = getApiUrl()
  if (!apiUrl) return false

  try {
    const response = await fetch(`${apiUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) return false

    const data = (await response.json()) as VerifyPaymentResponse
    return Boolean(data.verified)
  } catch {
    return false
  }
}

export async function startRazorpayCheckout(payload: {
  amount: number
  currency?: string
  items: CartItem[]
  customer: PaymentCustomer
  receipt?: string
  notes?: Record<string, string>
}): Promise<PaymentFlowResult> {
  const key = getKeyId()
  const currency = payload.currency || 'INR'
  const scriptLoaded = await loadRazorpayScript()
  const createdOrder = await createOrder({
    amount: payload.amount,
    currency,
    items: payload.items,
    customer: payload.customer,
  })

  const orderId = createdOrder?.id || `demo_${Date.now().toString(36)}`

  if (!scriptLoaded || !key || !window.Razorpay) {
    return {
      status: 'success',
      verified: false,
      orderId,
      amount: payload.amount,
      mode: 'demo',
    }
  }

  return new Promise<PaymentFlowResult>((resolve) => {
    const checkout = new window.Razorpay({
      key,
      amount: createdOrder?.amount || payload.amount,
      currency,
      name: 'RazorCart AI',
      description: 'AI-powered shopping. Razorpay-powered checkout.',
      order_id: createdOrder?.id,
      prefill: {
        name: payload.customer.name,
        email: payload.customer.email,
        contact: payload.customer.phone,
      },
      notes: payload.notes,
      theme: {
        color: '#2563eb',
      },
      handler: async (response) => {
        const verified = await verifyPayment({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || orderId,
          signature: response.razorpay_signature,
        })

        resolve({
          status: 'success',
          verified,
          orderId: response.razorpay_order_id || orderId,
          paymentId: response.razorpay_payment_id,
          amount: payload.amount,
          mode: verified ? 'live' : 'demo',
        })
      },
      modal: {
        ondismiss: () => {
          resolve({
            status: 'failed',
            verified: false,
            orderId,
            amount: payload.amount,
            mode: createdOrder ? 'live' : 'demo',
            message: 'Payment was cancelled before completion.',
          })
        },
      },
    })

    checkout.open()
  })
}
