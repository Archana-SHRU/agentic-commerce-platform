import api from './api'
import { Product } from '../types'

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

export function mapBackendProduct(product: BackendProduct): Product {
  return {
    id: String(product.id),

    name: product.name,

    price: product.price,

    originalPrice: undefined,

    rating: product.rating,

    reviewCount: 0,

    image: `https://placehold.co/600x400?text=${encodeURIComponent(
      product.name
    )}`,

    description: product.description || 'No description available',

    availability:
      product.stock > 10
        ? 'In Stock'
        : product.stock > 0
          ? 'Limited'
          : 'Out of Stock',

    category: product.category,

    features: [],

    merchant: {
      id: String(product.merchant_id),
      name: `Merchant ${product.merchant_id}`,
      logo: '',
      rating: 4.5,
      verified: true,
    },

    sku: `SKU-${product.id}`,
  }
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

export async function getMappedProducts(params?: {
  skip?: number
  limit?: number
  category?: string
  merchant_id?: number
  is_active?: boolean
  search?: string
}): Promise<Product[]> {
  const data = await getProducts(params)

  return data.items.map(mapBackendProduct)
}

export async function getMappedProduct(
  productId: number
): Promise<Product> {
  const data = await getProduct(productId)

  return mapBackendProduct(data)
}