import { Product } from '../types'

const COMPARE_KEY = 'ai_commerce_compare'
const MAX_COMPARE_ITEMS = 3

export const getCompareItems = (): Product[] => {
  try {
    const stored = localStorage.getItem(COMPARE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

const saveCompareItems = (items: Product[]) => {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('compare-updated'))
}

export const addToCompare = (
  product: Product
): {
  status: 'added' | 'duplicate' | 'full'
  items: Product[]
} => {
  const items = getCompareItems()

  if (items.some((p) => p.id === product.id)) {
    return {
      status: 'duplicate',
      items,
    }
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    return {
      status: 'full',
      items,
    }
  }

  const updated = [...items, product]

  saveCompareItems(updated)

  return {
    status: 'added',
    items: updated,
  }
}

export const removeFromCompare = (
  productId: string
): Product[] => {
  const updated = getCompareItems().filter(
    (p) => p.id !== productId
  )

  saveCompareItems(updated)

  return updated
}

export const clearCompare = () => {
  localStorage.removeItem(COMPARE_KEY)

  window.dispatchEvent(
    new Event('compare-updated')
  )
}

export const getCompareCount = (): number =>
  getCompareItems().length

export const MAX_COMPARE =
  MAX_COMPARE_ITEMS