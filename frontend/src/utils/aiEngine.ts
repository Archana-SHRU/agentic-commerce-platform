import { Product } from '../types'
import { getCatalogProducts } from './catalogStorage'

/**
 * Local fallback recommendation engine.
 *
 * No external LLM/API is configured for this project step, so this module
 * parses the customer's free-text query itself (category, price ceiling,
 * "best/top rated" intent, and simple "compare X and Y" requests) and ranks
 * the existing mock product catalog accordingly. It never hardcodes a single
 * product as "the" recommendation - results always come from filtering the
 * live product list based on what the user actually asked for.
 *
 * IMPORTANT: no API keys are used or required here - this is a pure
 * client-side heuristic engine.
 */

export interface AIQueryResult {
  text: string
  products: Product[]
  intent: 'category' | 'compare' | 'best-rated' | 'search' | 'none'
}

// Maps user-facing keywords to the `category` values used in mockProducts.ts
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Laptops: ['laptop', 'laptops', 'notebook', 'macbook', 'ultrabook', 'coding', 'programming'],
  Audio: ['headphone', 'headphones', 'earphone', 'earphones', 'earbud', 'earbuds', 'audio', 'speaker'],
  Footwear: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'running shoe'],
  Clothing: ['jeans', 'jean', 'shirt', 'clothing', 'apparel', 'outfit', 'wear'],
  Electronics: ['tv', 'television', 'electronics', 'smart tv'],
  Photography: ['camera', 'cameras', 'photography', 'mirrorless', 'dslr'],
  Wearables: ['watch', 'watches', 'smartwatch', 'wearable', 'fitness band'],
  Mobile: ['phone', 'phones', 'mobile', 'smartphone', 'android', 'iphone'],
  Bags: ['bag', 'bags', 'backpack', 'backpacks'],
}

function detectCategory(query: string): string | null {
  const lower = query.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }

  return null
}

/** Extracts a price ceiling from phrases like "under 30000", "under ₹30,000",
 * "below 5000", "less than 15000", "<20000". Returns null if none found. */
function detectMaxPrice(query: string): number | null {
  const lower = query.toLowerCase().replace(/,/g, '')

  const patterns = [
    /(?:under|below|less than|cheaper than|within|budget of|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(k)?/,
    /₹\s*(\d+(?:\.\d+)?)\s*(k)?\s*(?:or less|budget)/,
  ]

  for (const pattern of patterns) {
    const match = lower.match(pattern)
    if (match) {
      let value = parseFloat(match[1])
      if (match[2] === 'k') value *= 1000
      if (Number.isFinite(value) && value > 0) return value
    }
  }

  return null
}

function detectBestRatedIntent(query: string): boolean {
  const lower = query.toLowerCase()
  return (
    lower.includes('best rating') ||
    lower.includes('best rated') ||
    lower.includes('top rated') ||
    lower.includes('highest rated') ||
    (lower.includes('best') && lower.includes('rating'))
  )
}

/** Detects "compare X and Y" style queries and tries to resolve X/Y to
 * actual products by fuzzy name matching. */
function detectCompareIntent(query: string): Product[] | null {
  const lower = query.toLowerCase()
  if (!lower.includes('compare')) return null

  // "compare iphone and samsung" / "compare X vs Y" / "compare X with Y"
  const match = lower.match(/compare\s+(.+?)\s+(?:and|vs\.?|with)\s+(.+)/)
  if (!match) return null

  const [, aRaw, bRaw] = match
  const findBest = (fragment: string): Product | undefined => {
    const words = fragment.trim().split(/\s+/).filter(Boolean)
    let best: Product | undefined
    let bestScore = 0

    for (const product of getCatalogProducts()) {
      const name = product.name.toLowerCase()
      const score = words.reduce((acc, w) => (name.includes(w) ? acc + 1 : acc), 0)
      if (score > bestScore) {
        bestScore = score
        best = product
      }
    }

    return bestScore > 0 ? best : undefined
  }

  const a = findBest(aRaw)
  const b = findBest(bRaw)

  const found = [a, b].filter((p): p is Product => Boolean(p))
  return found.length > 0 ? found : null
}

function formatPrice(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

/**
 * Main entry point: takes a raw customer query and returns a natural
 * language response plus a ranked list of matching products.
 */
export function getAIRecommendation(query: string): AIQueryResult {
  const trimmed = query.trim()

  if (!trimmed) {
    return {
      text: "I didn't quite catch that - what are you shopping for today?",
      products: [],
      intent: 'none',
    }
  }

  // 1. Compare intent
  const compareMatches = detectCompareIntent(trimmed)
  if (compareMatches) {
    const names = compareMatches.map((p) => p.name).join(' vs ')
    return {
      text:
        compareMatches.length === 2
          ? `Here's a side-by-side look at ${names}. I've added both to your comparison list.`
          : `I could only confidently match one product for that comparison: ${names}. Try being more specific about the other item.`,
      products: compareMatches,
      intent: 'compare',
    }
  }

  const category = detectCategory(trimmed)
  const maxPrice = detectMaxPrice(trimmed)
  const wantsBestRated = detectBestRatedIntent(trimmed)

  let candidates = getCatalogProducts()

  if (category) {
    candidates = candidates.filter((p) => p.category === category)
  }

  if (maxPrice !== null) {
    candidates = candidates.filter((p) => p.price <= maxPrice)
  }

  // If neither category nor price was detected, fall back to a plain
  // text search across name/category/description/merchant.
  if (!category && maxPrice === null && !wantsBestRated) {
    const lower = trimmed.toLowerCase()
    candidates = getCatalogProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.merchant.name.toLowerCase().includes(lower)
    )
  }

  // Rank: best-rated first when asked, otherwise rating desc as a
  // reasonable relevance proxy (never a fixed single hardcoded product).
  candidates.sort((a, b) => b.rating - a.rating)

  const results = candidates.slice(0, 6)

  // Build a response message describing exactly what was matched.
  let text: string
  if (results.length === 0) {
    text = category
      ? `I couldn't find any ${category.toLowerCase()} ${maxPrice ? `under ${formatPrice(maxPrice)} ` : ''}right now. Want me to show all ${category.toLowerCase()} instead?`
      : `I couldn't find a match for "${trimmed}". Try mentioning a category like phones, laptops, headphones, or watches.`
  } else if (wantsBestRated && !category) {
    text = `Here ${results.length === 1 ? 'is' : 'are'} the top-rated product${results.length === 1 ? '' : 's'} across our catalog.`
  } else if (category && maxPrice !== null) {
    text = `Found ${results.length} ${category.toLowerCase()} under ${formatPrice(maxPrice)}. Here are the best matches, ranked by rating.`
  } else if (category) {
    text = `Here ${results.length === 1 ? 'is' : 'are'} ${results.length} ${category.toLowerCase()} option${results.length === 1 ? '' : 's'} for you, sorted by rating.`
  } else if (maxPrice !== null) {
    text = `Found ${results.length} product${results.length === 1 ? '' : 's'} under ${formatPrice(maxPrice)}.`
  } else {
    text = `Here's what I found matching "${trimmed}".`
  }

  return {
    text,
    products: results,
    intent: category ? 'category' : wantsBestRated ? 'best-rated' : 'search',
  }
}

/** Derives ProductsPage filter state from a query, so navigating from the
 * AI assistant actually applies the same filters shown in chat. */
export function deriveProductsPageFilters(query: string): {
  category: string
  maxPrice: number | null
  search: string
} {
  const category = detectCategory(query)
  const maxPrice = detectMaxPrice(query)

  return {
    category: category ?? 'All',
    maxPrice,
    search: category ? '' : query,
  }
}
