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
  on?: (
    event: 'payment.failed',
    callback: (response: RazorpayFailureResponse) => void
  ) => void
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_signature?: string
}

type RazorpayFailureResponse = {
  error?: {
    description?: string
    reason?: string
    metadata?: {
      payment_id?: string
      order_id?: string
    }
  }
}

export type PaymentFlowResult =
  | {
      status: 'success'
      verified: true
      orderId: string
      paymentId: string
      amount: number
    }
  | {
      status: 'failed'
      verified: false
      orderId: string
      amount: number
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
  key_id?: string
}

type VerifyPaymentResponse = {
  verified?: boolean
  message?: string
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

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as {
      detail?: unknown
      message?: unknown
    }

    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }
  } catch {
    // Ignore parse failures and use the fallback message.
  }

  return fallback
}

async function createOrder(payload: {
  amount: number
  currency: string
  items: CartItem[]
  customer: PaymentCustomer
  backendOrderId?: number
}): Promise<CreateOrderResponse> {
  const apiUrl = getApiUrl()

  if (!apiUrl) {
    throw new Error('Backend API URL is not configured.')
  }

  try {
    const response = await fetch(`${apiUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          'Unable to create the payment order with Razorpay.'
        )
      )
    }

    return (await response.json()) as CreateOrderResponse
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unable to create the payment order with Razorpay.')
  }
}

async function verifyPayment(payload: {
  paymentId: string
  orderId: string
  signature?: string
  backendOrderId?: number
}): Promise<VerifyPaymentResponse> {
  const apiUrl = getApiUrl()

  if (!apiUrl) {
    return {
      verified: false,
      message: 'Backend API URL is not configured.',
    }
  }

  try {
    const response = await fetch(`${apiUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        verified: false,
        message: await readErrorMessage(
          response,
          'Payment signature verification failed.'
        ),
      }
    }

    const data = (await response.json()) as VerifyPaymentResponse

    return {
      verified: Boolean(data.verified),
      message:
        data.message ||
        (data.verified
          ? 'Payment signature verified successfully'
          : 'Payment signature verification failed'),
    }
  } catch {
    return {
      verified: false,
      message: 'Unable to verify the payment with the backend.',
    }
  }
}

function getFailureMessage(response: RazorpayFailureResponse) {
  return (
    response.error?.description ||
    response.error?.reason ||
    'Payment could not be completed.'
  )
}

export async function startRazorpayCheckout(payload: {
  amount: number
  currency?: string
  items: CartItem[]
  customer: PaymentCustomer
  receipt?: string
  notes?: Record<string, string>
  backendOrderId?: number
}): Promise<PaymentFlowResult> {
  const currency = payload.currency || 'INR'
  const scriptLoaded = await loadRazorpayScript()

  if (!scriptLoaded) {
    return {
      status: 'failed',
      verified: false,
      orderId: 'pending',
      amount: payload.amount,
      message: 'Unable to load the Razorpay Checkout script.',
    }
  }

  const createdOrder = await createOrder({
    amount: payload.amount,
    currency,
    items: payload.items,
    customer: payload.customer,
    backendOrderId: payload.backendOrderId,
  })

  const key = getKeyId() || createdOrder.key_id || ''

  if (!key) {
    return {
      status: 'failed',
      verified: false,
      orderId: createdOrder.id,
      amount: payload.amount,
      message: 'Razorpay public key is not configured on the frontend.',
    }
  }

  const RazorpayCheckout = window.Razorpay

  if (!RazorpayCheckout) {
    return {
      status: 'failed',
      verified: false,
      orderId: createdOrder.id,
      amount: payload.amount,
      message: 'Razorpay Checkout is not available in the browser.',
    }
  }

  return new Promise<PaymentFlowResult>((resolve) => {
    let settled = false

    const settle = (result: PaymentFlowResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const checkout = new RazorpayCheckout({
      key,
      amount: createdOrder.amount,
      currency,
      name: 'RazorCart AI',
      description: 'AI-powered shopping. Razorpay-powered checkout.',
      order_id: createdOrder.id,
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
        const verification = await verifyPayment({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || createdOrder.id,
          signature: response.razorpay_signature,
          backendOrderId: payload.backendOrderId,
        })

        if (verification.verified) {
          settle({
            status: 'success',
            verified: true,
            orderId: response.razorpay_order_id || createdOrder.id,
            paymentId: response.razorpay_payment_id,
            amount: payload.amount,
          })
          return
        }

        settle({
          status: 'failed',
          verified: false,
          orderId: response.razorpay_order_id || createdOrder.id,
          amount: payload.amount,
          message:
            verification.message ||
            'Payment signature verification failed.',
        })
      },
      modal: {
        ondismiss: () => {
          settle({
            status: 'failed',
            verified: false,
            orderId: createdOrder.id,
            amount: payload.amount,
            message: 'Payment was closed before completion.',
          })
        },
      },
    })

    checkout.on?.('payment.failed', async (response) => {
      const orderId = response.error?.metadata?.order_id || createdOrder.id
      const paymentId = response.error?.metadata?.payment_id

      if (paymentId) {
        const verification = await verifyPayment({
          paymentId,
          orderId,
          backendOrderId: payload.backendOrderId,
        })

        settle({
          status: 'failed',
          verified: false,
          orderId,
          amount: payload.amount,
          message:
            verification.message || getFailureMessage(response),
        })
        return
      }

      settle({
        status: 'failed',
        verified: false,
        orderId,
        amount: payload.amount,
        message: getFailureMessage(response),
      })
    })

    checkout.open()
  })
}

