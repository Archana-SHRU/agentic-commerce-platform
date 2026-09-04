import api from './api'
import { Product } from '../types'
import { getProductImage } from '../utils/productImages'

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
  // Optional. Present only if the backend later starts returning a real
  // image URL - when it does, it is preserved rather than overridden.
  image_url?: string | null
  image?: string | null
}

export interface PaginatedProducts {
  total: number
  skip: number
  limit: number
  items: BackendProduct[]
}

/**
 * Resolve the image for a backend product.
 *
 * 1. If the backend already supplies a real http(s) image URL, keep it.
 * 2. Otherwise reuse the EXISTING image system in utils/productImages.ts,
 *    which maps known product names and categories to real images and falls
 *    back to a guaranteed inline SVG when the category is unknown.
 *
 * There is deliberately no second image system here.
 */
function resolveProductImage(product: BackendProduct): string {
  const backendImage = (product.image_url ?? product.image ?? '').trim()

  if (/^https?:\/\//i.test(backendImage)) {
    return backendImage
  }

  return getProductImage(product.name, product.category)
}

export function mapBackendProduct(product: BackendProduct): Product {
  return {
    id: String(product.id),

    name: product.name,

    price: product.price,

    originalPrice: undefined,

    rating: product.rating,

    reviewCount: 0,

    image: resolveProductImage(product),

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