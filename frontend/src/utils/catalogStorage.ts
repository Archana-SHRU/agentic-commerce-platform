import { Product, Merchant } from '../types'
import { products as seedProducts } from './mockProducts'
import { getStockImageForCategory } from './productImages'

export const CATALOG_STORAGE_KEY = 'merchant_catalog_products'
export const CATALOG_UPDATED_EVENT = 'catalog-updated'

const API_URL = 'http://localhost:8000'

interface BackendProduct {
  id: number
  name: string
  description: string | null
  category: string
  price: string | number
  stock: number
  rating: string | number
  is_active: boolean
  merchant_id: number
}

const getMerchant = (merchantId: number): Merchant => {
  const merchants: Record<number, Merchant> = {
    1: {
      id: '1',
      name: 'TechStore',
      logo: '',
      rating: 4.5,
      verified: true,
    },
    2: {
      id: '2',
      name: 'Premium Electronics',
      logo: '',
      rating: 4.7,
      verified: true,
    },
    3: {
      id: '3',
      name: 'Fashion Hub',
      logo: '',
      rating: 4.4,
      verified: true,
    },
  }

  return (
    merchants[merchantId] ?? {
      id: String(merchantId),
      name: 'Verified Merchant',
      logo: '',
      rating: 4.5,
      verified: true,
    }
  )
}

const convertBackendProduct = (product: BackendProduct): Product => {
  const stock = Number(product.stock)

  let availability: Product['availability'] = 'In Stock'

  if (stock <= 0) {
    availability = 'Out of Stock'
  } else if (stock <= 10) {
    availability = 'Limited'
  }

  return {
    id: String(product.id),
    name: product.name,
    price: Number(product.price),
    rating: Number(product.rating),
    reviewCount: Math.floor(Number(product.rating) * 100),
    image: getStockImageForCategory(product.category),
    description:
      product.description ??
      `${product.name} - Premium quality product available on RazorCart AI.`,
    availability,
    category: product.category,
    features: [
      'Premium quality product',
      `Category: ${product.category}`,
      `${stock} items currently available`,
      'Verified merchant',
    ],
    merchant: getMerchant(product.merchant_id),
    sku: `SKU-${product.id}`,
  }
}

export const fetchCatalogProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_URL}/products`)

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()

    const backendProducts: BackendProduct[] = data.items ?? []

    const products = backendProducts
      .filter((product) => product.is_active)
      .map(convertBackendProduct)

    saveCatalogProducts(products)

    return products
  } catch (error) {
    console.error('Unable to fetch products from backend:', error)

    return getCatalogProducts()
  }
}

export const getCatalogProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(CATALOG_STORAGE_KEY)

    if (stored) {
      return JSON.parse(stored) as Product[]
    }
  } catch (error) {
    console.error('Unable to load catalog products:', error)
  }

  return seedProducts
}

export const saveCatalogProducts = (products: Product[]) => {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products))

  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT))
}

export const getCatalogProductById = (
  id: string
): Product | undefined => {
  return getCatalogProducts().find(
    (product) => String(product.id) === String(id)
  )
}