import api from './api'

export const MERCHANT_TOKEN_STORAGE_KEY =
  'razorcart_ai_merchant_access_token'

export interface Merchant {
  id: number
  name: string
  email: string
}

export interface MerchantLoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  merchant: Merchant
}

export interface MerchantOrder {
  id: number
  merchant_id: number
  customer_id: string
  status: string
  payment_status: string
  total_amount: string | number
  created_at: string
}

export interface PaginatedMerchantOrders {
  total: number
  skip: number
  limit: number
  items: MerchantOrder[]
}

export function getMerchantToken(): string | null {
  return localStorage.getItem(MERCHANT_TOKEN_STORAGE_KEY)
}

export function storeMerchantToken(token: string | null) {
  if (token) {
    localStorage.setItem(MERCHANT_TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(MERCHANT_TOKEN_STORAGE_KEY)
  }
}

function merchantHeaders() {
  const token = getMerchantToken()

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

export async function merchantLogin(email: string, password: string) {
  const response = await api.post<MerchantLoginResponse>(
    '/merchant-auth/login',
    { email, password }
  )

  return response.data
}

export async function fetchMerchantProfile() {
  const response = await api.get<Merchant>(
    '/merchant-dashboard/me',
    { headers: merchantHeaders() }
  )

  return response.data
}

export async function fetchMerchantOrders() {
  const response = await api.get<PaginatedMerchantOrders>(
    '/merchant-dashboard/orders',
    { headers: merchantHeaders() }
  )

  return response.data
}

export function merchantLogout() {
  storeMerchantToken(null)
}