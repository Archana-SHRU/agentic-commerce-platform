/**
 * Product image helpers
 *
 * Provides real product/category images with a guaranteed SVG fallback.
 */

const CATEGORY_COLORS: Record<string, string> = {
  Laptops: '#3B82F6',
  Audio: '#8B5CF6',
  Footwear: '#F97316',
  Apparel: '#EC4899',
  Electronics: '#06B6D4',
  Wearables: '#10B981',
  Mobiles: '#6366F1',
  Accessories: '#A16207',
}

const DEFAULT_COLOR = '#94A3B8'

/**
 * Guaranteed SVG fallback image.
 */
export function getCategoryFallbackImage(category: string): string {
  const color = CATEGORY_COLORS[category] ?? DEFAULT_COLOR
  const label = (category || 'Product').toUpperCase()

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="600"
      height="400"
      viewBox="0 0 600 400"
    >
      <rect width="600" height="400" fill="${color}" opacity="0.12"/>

      <rect
        x="0"
        y="0"
        width="600"
        height="400"
        fill="none"
        stroke="${color}"
        stroke-opacity="0.3"
        stroke-width="2"
      />

      <circle
        cx="300"
        cy="160"
        r="48"
        fill="${color}"
        opacity="0.25"
      />

      <text
        x="300"
        y="250"
        font-family="Arial, sans-serif"
        font-size="24"
        font-weight="700"
        fill="${color}"
        text-anchor="middle"
      >
        ${label}
      </text>

      <text
        x="300"
        y="280"
        font-family="Arial, sans-serif"
        font-size="14"
        fill="${color}"
        opacity="0.7"
        text-anchor="middle"
      >
        Image unavailable
      </text>
    </svg>
  `.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Category-based stock images.
 */
export const CATEGORY_STOCK_IMAGES: Record<string, string> = {
  Laptops:
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85&auto=format&fit=crop',

  Audio:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85&auto=format&fit=crop',

  Footwear:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&auto=format&fit=crop',

  Electronics:
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=85&auto=format&fit=crop',

  Wearables:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85&auto=format&fit=crop',

  Mobiles:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=85&auto=format&fit=crop',

  Apparel:
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=85&auto=format&fit=crop',

  Accessories:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85&auto=format&fit=crop',
}

/**
 * Product-specific images.
 * This gives each important product its own relevant image.
 */
const PRODUCT_IMAGES: Record<string, string> = {
  'Wireless Headphones Pro':
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85&auto=format&fit=crop',

  'Wireless Headphones':
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85&auto=format&fit=crop',

  'MacBook Pro 14" M2':
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=85&auto=format&fit=crop',

  'Sony WH-1000XM5 Headphones':
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=85&auto=format&fit=crop',

  'Dell XPS 13 Plus':
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85&auto=format&fit=crop',

  'Samsung Galaxy S24 Ultra':
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=85&auto=format&fit=crop',

  'Apple Watch Series 9':
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=85&auto=format&fit=crop',

  'Logitech MX Master 3S':
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=85&auto=format&fit=crop',

  'Boat Airdopes 141':
    'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=85&auto=format&fit=crop',

  'Nike Air Max 90':
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&auto=format&fit=crop',

  "Levi's 511 Slim Fit Jeans":
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85&auto=format&fit=crop',

  'Adidas Ultraboost 22':
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&auto=format&fit=crop',

  'Ray-Ban Aviator Classic':
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=85&auto=format&fit=crop',

  'Zara Wool Blend Overcoat':
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=85&auto=format&fit=crop',

  'Fossil Gen 6 Smartwatch':
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85&auto=format&fit=crop',
}

/**
 * Returns the best image for a product.
 */
export function getProductImage(
  productName: string,
  category: string
): string {
  return (
    PRODUCT_IMAGES[productName] ??
    CATEGORY_STOCK_IMAGES[category] ??
    getCategoryFallbackImage(category)
  )
}

/**
 * Returns a category image.
 */
export function getStockImageForCategory(
  category: string
): string {
  return (
    CATEGORY_STOCK_IMAGES[category] ??
    getCategoryFallbackImage(category)
  )
}