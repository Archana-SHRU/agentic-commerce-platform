import api from './api'

export interface BackendProduct {
  id: number
  merchant_id: number
  name: string
  description: string | null
  category: string
  price: number
  stock: number
  rating: number
  is_active: boolean
  created_at: string
}

export interface PaginatedProducts {
  total: number
  skip: number
  limit: number
  items: BackendProduct[]
}

export async function getProducts(params?: {
  skip?: number
  limit?: number
  category?: string
  merchant_id?: number
  is_active?: boolean
  search?: string
}) {
  const response = await api.get<PaginatedProducts>('/products', {
    params,
  })

  return response.data
}

export async function getProduct(productId: number) {
  const response = await api.get<BackendProduct>(
    `/products/${productId}`
  )

  return response.data
}