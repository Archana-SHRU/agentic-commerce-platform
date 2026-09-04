import api from './api'

export interface CreateOrderItem {
  product_id: number
  quantity: number
}

export interface CreateOrderPayload {
  customer_id?: string
  items: CreateOrderItem[]
}

export interface BackendOrderItem {
  id: number
  order_id: number
  product_id: number
  product_name?: string | null
  quantity: number
  unit_price: number
}

export interface BackendOrder {
  id: number
  merchant_id: number
  customer_id?: string | null
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  // Razorpay tracking. `payment_verified` is set by the backend only after a
  // successful server-side signature check.
  razorpay_order_id?: string | null
  razorpay_payment_id?: string | null
  payment_verified?: boolean
  items: BackendOrderItem[]
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<BackendOrder> {
  const response = await api.post<BackendOrder>(
    '/orders',
    payload
  )

  return response.data
}

export async function getOrders(params?: {
  skip?: number
  limit?: number
}) {
  const response = await api.get('/orders', {
    params,
  })

  return response.data
}

export async function getOrder(orderId: number) {
  const response = await api.get<BackendOrder>(
    `/orders/${orderId}`
  )

  return response.data
}