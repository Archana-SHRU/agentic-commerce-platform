/**
 * Product image helpers.
 *
 * The old mock data used via.placeholder.com, which was discontinued and now
 * returns broken images everywhere. This module provides:
 *  1. Real, category-matched stock photo URLs (Unsplash) for the mock catalog.
 *  2. A guaranteed-to-render SVG fallback (data URI, no network dependency)
 *     used via onError on every <img> that renders a product photo, so a
 *     product never shows a broken-image icon even if a remote URL fails.
 */

const CATEGORY_COLORS: Record<string, string> = {
  Laptops: '#3B82F6',
  Audio: '#8B5CF6',
  Footwear: '#F97316',
  Clothing: '#EC4899',
  Electronics: '#06B6D4',
  Photography: '#64748B',
  Wearables: '#10B981',
  Mobile: '#6366F1',
  Bags: '#A16207',
}

const DEFAULT_COLOR = '#94A3B8'

/** A tiny, dependency-free SVG placeholder that always renders, showing the
 * category name on a themed background. Used as the onError fallback. */
export function getCategoryFallbackImage(category: string): string {
  const color = CATEGORY_COLORS[category] ?? DEFAULT_COLOR
  const label = (category || 'Product').toUpperCase()

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="${color}" opacity="0.12"/>
      <rect x="0" y="0" width="600" height="400" fill="none" stroke="${color}" stroke-opacity="0.3" stroke-width="2"/>
      <circle cx="300" cy="160" r="48" fill="${color}" opacity="0.25"/>
      <text x="300" y="250" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${color}" text-anchor="middle">${label}</text>
      <text x="300" y="280" font-family="Arial, sans-serif" font-size="14" fill="${color}" opacity="0.7" text-anchor="middle">Image unavailable</text>
    </svg>
  `.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Real category-matched stock photo URLs used to seed mockProducts.ts. */
export const CATEGORY_STOCK_IMAGES: Record<string, string> = {
  Laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80&auto=format&fit=crop',
  Audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80&auto=format&fit=crop',
  Footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
  Clothing: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&auto=format&fit=crop',
  Electronics: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80&auto=format&fit=crop',
  Photography: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80&auto=format&fit=crop',
  Wearables: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop',
  Mobile: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80&auto=format&fit=crop',
  Bags: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format&fit=crop',
}

export function getStockImageForCategory(category: string): string {
  return CATEGORY_STOCK_IMAGES[category] ?? getCategoryFallbackImage(category)
}
