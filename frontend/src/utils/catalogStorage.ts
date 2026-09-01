import { Product } from '../types'
import { products as seedProducts } from './mockProducts'

export const CATALOG_STORAGE_KEY = 'merchant_catalog_products'
export const CATALOG_UPDATED_EVENT = 'catalog-updated'

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

export const getCatalogProductById = (id: string): Product | undefined =>
  getCatalogProducts().find((p) => p.id === id)
