import { useParams, useNavigate } from 'react-router-dom'
import { getCatalogProductById, getCatalogProducts } from '../utils/catalogStorage'
import { Star, ShoppingCart, Share2, Heart, Check, Scale, Zap } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { useState } from 'react'
import { addToCart } from '../utils/cartStorage'
import { addToCompare } from '../utils/compareStorage'
import { showToast } from '../utils/toastBus'
import { getCategoryFallbackImage } from '../utils/productImages'

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const product = id ? getCatalogProductById(id) : undefined
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  const relatedProducts = getCatalogProducts().filter(
    (p) => p.category === product.category && p.id !== product.id
  )

  const handleAddToCart = () => {
    addToCart(product, quantity)
    showToast(`${quantity} x ${product.name} added to cart`, 'success')
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    navigate('/checkout')
  }

  const handleCompare = () => {
    const result = addToCompare(product)
    if (result.status === 'added') {
      showToast(`${product.name} added to comparison`, 'success')
    } else if (result.status === 'duplicate') {
      showToast(`${product.name} is already in your comparison list`, 'info')
    } else {
      showToast('You can compare up to 3 products at a time', 'error')
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on RazorCart AI`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled the share sheet - no error needed
      }
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Product link copied to clipboard', 'success')
    } catch {
      showToast('Unable to copy link', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-gray-600">
          <button onClick={() => navigate('/')} className="hover:text-blue-600">
            Home
          </button>
          <span>›</span>
          <button onClick={() => navigate('/products')} className="hover:text-blue-600">
            Products
          </button>
          <span>›</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Image */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden p-8">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = getCategoryFallbackImage(product.category)
              }}
            />
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {/* Badge */}
            {product.availability === 'Limited' && (
              <div className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                Limited Stock
              </div>
            )}

            {/* Name */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-900">{product.rating}</span>
              <span className="text-gray-600">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p
                className={`font-semibold ${
                  product.availability === 'In Stock'
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}
              >
                ✓ {product.availability}
              </p>
              {product.availability === 'In Stock' && (
                <p className="text-sm text-gray-600 mt-1">Get it by tomorrow</p>
              )}
            </div>

            {/* Merchant */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Sold by</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">{product.merchant.name}</p>
                  <p className="text-sm text-gray-600">⭐ {product.merchant.rating}</p>
                </div>
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="mb-6 space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="font-bold text-gray-700"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="font-bold text-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.availability === 'Out of Stock'}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.availability === 'Out of Stock'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Buy Now
                </button>
                <button
                  onClick={handleCompare}
                  className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                >
                  <Scale size={18} />
                  Compare
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border ${
                    isFavorite
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-red-200'
                  }`}
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  {isFavorite ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>

            {/* Features */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-3">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={18} className="text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* AI Recommendation Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 mb-16">
          <div className="flex gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">🤖 AI Recommendation</h3>
              <p className="text-gray-700 mb-3">
                Based on your browsing history and similar products, we recommend this item because:
              </p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li>✓ Best value in its category (₹/features ratio)</li>
                <li>✓ Highly rated by similar customers (4.8/5 stars)</li>
                <li>✓ Fast delivery available (Next-day shipping)</li>
              </ul>
              <button
                onClick={() => {
                  handleCompare()
                  navigate('/compare')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Compare with alternatives
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
