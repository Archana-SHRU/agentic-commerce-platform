import { Product } from '../types'
import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Eye, Scale } from 'lucide-react'
import { addToCart } from '../utils/cartStorage'
import { addToCompare } from '../utils/compareStorage'
import { showToast } from '../utils/toastBus'
import { getCategoryFallbackImage } from '../utils/productImages'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onCompare?: (product: Product) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onCompare,
}) => {
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product)
      return
    }
    addToCart(product)
    showToast(`${product.name} added to cart`, 'success')
  }

  const handleCompare = () => {
    if (onCompare) {
      onCompare(product)
      return
    }
    const result = addToCompare(product)
    if (result.status === 'added') {
      showToast(`${product.name} added to comparison`, 'success')
    } else if (result.status === 'duplicate') {
      showToast(`${product.name} is already in your comparison list`, 'info')
    } else {
      showToast('You can compare up to 3 products at a time', 'error')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative bg-gray-100 h-48 overflow-hidden group">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = getCategoryFallbackImage(product.category)
          }}
        />
        {product.availability === 'Limited' && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Limited
          </div>
        )}
        {product.availability === 'Out of Stock' && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Merchant */}
        <p className="text-xs text-gray-500 mb-2">{product.merchant.name}</p>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm lg:text-base">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-gray-900">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.originalPrice && (
            <p className="text-xs text-green-600 font-medium">
              Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        {/* Availability */}
        <p
          className={`text-xs font-medium mb-4 ${
            product.availability === 'In Stock'
              ? 'text-green-600'
              : product.availability === 'Limited'
                ? 'text-orange-600'
                : 'text-red-600'
          }`}
        >
          {product.availability}
        </p>

        {/* Actions */}
        <div className="space-y-2">
          <Link
            to={`/product/${product.id}`}
            className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Eye size={16} className="inline mr-2" />
            View Details
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.availability === 'Out of Stock'}
              className="px-2 py-2 bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <ShoppingCart size={14} className="flex-shrink-0" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleCompare}
              className="px-2 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Scale size={14} className="flex-shrink-0" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
