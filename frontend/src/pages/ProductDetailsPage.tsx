import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Star,
  ShoppingCart,
  Share2,
  Heart,
  Check,
  Scale,
  Zap,
} from 'lucide-react'

import { ProductCard } from '../components/ProductCard'
import { Product } from '../types'
import { addToCart } from '../utils/cartStorage'
import { addToCompare } from '../utils/compareStorage'
import { showToast } from '../utils/toastBus'
import { getCategoryFallbackImage } from '../utils/productImages'

import {
  getMappedProduct,
  getMappedProducts,
} from '../services/productService'

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id || Number.isNaN(Number(id))) {
        setError('Invalid product ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get selected product from backend
        const productData = await getMappedProduct(Number(id))

        setProduct(productData)

        // Get related products
        const allProducts = await getMappedProducts({
          skip: 0,
          limit: 100,
        })

        const related = allProducts.filter(
          (item) =>
            item.category === productData.category &&
            item.id !== productData.id
        )

        setRelatedProducts(related)
      } catch (err) {
        console.error('Failed to load product:', err)

        setError(
          'Unable to load product details. Please check that the backend is running.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return

    addToCart(product, quantity)

    showToast(
      `${quantity} x ${product.name} added to cart`,
      'success'
    )
  }

  const handleBuyNow = () => {
    if (!product) return

    addToCart(product, quantity)

    navigate('/checkout')
  }

  const handleCompare = () => {
    if (!product) return

    const result = addToCompare(product)

    if (result.status === 'added') {
      showToast(
        `${product.name} added to comparison`,
        'success'
      )
    } else if (result.status === 'duplicate') {
      showToast(
        `${product.name} is already in your comparison list`,
        'info'
      )
    } else {
      showToast(
        'You can compare up to 3 products at a time',
        'error'
      )
    }
  }

  const handleShare = async () => {
    if (!product) return

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
        // User cancelled sharing
      }

      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)

      showToast(
        'Product link copied to clipboard',
        'success'
      )
    } catch {
      showToast(
        'Unable to copy link',
        'error'
      )
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">

          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-5" />

          <h1 className="text-xl font-bold text-gray-900">
            Loading product details...
          </h1>

          <p className="text-gray-500 mt-2">
            Fetching product from backend
          </p>

        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center max-w-md">

          <h1 className="text-2xl font-bold text-red-600">
            Product not found
          </h1>

          <p className="text-gray-600 mt-3">
            {error || 'Unable to find this product.'}
          </p>

          <button
            onClick={() => navigate('/products')}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Products
          </button>

        </div>

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}

        <div className="flex items-center gap-2 mb-8 text-sm text-gray-600">

          <button
            onClick={() => navigate('/')}
            className="hover:text-blue-600"
          >
            Home
          </button>

          <span>›</span>

          <button
            onClick={() => navigate('/products')}
            className="hover:text-blue-600"
          >
            Products
          </button>

          <span>›</span>

          <span className="text-gray-900 truncate">
            {product.name}
          </span>

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
                e.currentTarget.src =
                  getCategoryFallbackImage(product.category)
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

            {/* Category */}

            <p className="text-sm text-blue-600 font-semibold mb-2">

              {product.category}

            </p>

            {/* Name */}

            <h1 className="text-3xl font-bold text-gray-900 mb-4">

              {product.name}

            </h1>

            {/* Description */}

            <p className="text-gray-600 mb-6">

              {product.description}

            </p>

            {/* Rating */}

            <div className="flex items-center gap-4 mb-6">

              <div className="flex items-center">

                {[...Array(5)].map((_, i) => (

                  <Star
                    key={i}
                    size={18}
                    className={
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }
                  />

                ))}

              </div>

              <span className="font-semibold text-gray-900">

                {product.rating}

              </span>

              <span className="text-gray-600">

                ({product.reviewCount} reviews)

              </span>

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

                      Save ₹
                      {(
                        product.originalPrice -
                        product.price
                      ).toLocaleString('en-IN')}

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
                    : product.availability === 'Limited'
                      ? 'text-orange-600'
                      : 'text-red-600'
                }`}
              >

                ✓ {product.availability}

              </p>

              {product.availability === 'In Stock' && (

                <p className="text-sm text-gray-600 mt-1">

                  Available for delivery

                </p>

              )}

            </div>

            {/* Merchant */}

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">

              <p className="text-sm text-gray-600 mb-2">

                Sold by

              </p>

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">

                  {product.merchant.name.charAt(0)}

                </div>

                <div>

                  <p className="font-semibold text-gray-900">

                    {product.merchant.name}

                  </p>

                  <p className="text-sm text-gray-600">

                    ⭐ {product.merchant.rating}

                  </p>

                </div>

              </div>

            </div>

            {/* Quantity */}

            <div className="mb-6 space-y-4">

              <div className="flex items-center gap-4">

                <span className="text-gray-700 font-medium">

                  Quantity:

                </span>

                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">

                  <button
                    onClick={() =>
                      setQuantity(
                        Math.max(1, quantity - 1)
                      )
                    }
                    className="font-bold text-gray-700 px-2"
                  >
                    −
                  </button>

                  <span className="w-8 text-center font-medium">

                    {quantity}

                  </span>

                  <button
                    onClick={() =>
                      setQuantity(quantity + 1)
                    }
                    className="font-bold text-gray-700 px-2"
                  >
                    +
                  </button>

                </div>

              </div>

              {/* Action Buttons */}

              <div className="grid grid-cols-2 gap-4">

                <button
                  onClick={handleAddToCart}
                  disabled={
                    product.availability === 'Out of Stock'
                  }
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >

                  <ShoppingCart size={18} />

                  Add to Cart

                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={
                    product.availability === 'Out of Stock'
                  }
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
                  onClick={() =>
                    setIsFavorite(!isFavorite)
                  }
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border ${
                    isFavorite
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-red-200'
                  }`}
                >

                  <Heart
                    size={18}
                    fill={
                      isFavorite
                        ? 'currentColor'
                        : 'none'
                    }
                  />

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

              <h3 className="font-semibold text-gray-900 mb-4">

                Key Features

              </h3>

              {product.features.length > 0 ? (

                <ul className="space-y-3">

                  {product.features.map(
                    (feature, idx) => (

                      <li
                        key={idx}
                        className="flex items-start gap-3"
                      >

                        <Check
                          size={18}
                          className="text-green-600 flex-shrink-0 mt-1"
                        />

                        <span className="text-gray-700">

                          {feature}

                        </span>

                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p className="text-gray-500 text-sm">

                  Product feature details will be available soon.

                </p>

              )}

            </div>

          </div>

        </div>

        {/* AI Recommendation */}

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 mb-16">

          <h3 className="text-lg font-bold text-gray-900 mb-3">

            🤖 AI Recommendation

          </h3>

          <p className="text-gray-700 mb-3">

            Based on this product's category, rating and availability,
            this could be a good option for you.

          </p>

          <ul className="space-y-2 text-gray-700 mb-4">

            <li>
              ✓ Highly rated product
            </li>

            <li>
              ✓ Available from verified marketplace merchant
            </li>

            <li>
              ✓ Compare with similar products before buying
            </li>

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

        {/* Related Products */}

        {relatedProducts.length > 0 && (

          <div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">

              Related Products

            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {relatedProducts
                .slice(0, 4)
                .map((relatedProduct) => (

                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />

                ))}

            </div>

          </div>

        )}

      </div>

    </div>
  )
}