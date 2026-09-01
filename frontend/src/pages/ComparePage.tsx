import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus } from 'lucide-react'
import { Product } from '../types'
import { getCatalogProducts } from '../utils/catalogStorage'
import { ProductComparison } from '../components/ProductComparison'
import { ProductCard } from '../components/ProductCard'
import { getCategoryFallbackImage } from '../utils/productImages'
import { addToCart } from '../utils/cartStorage'
import {
  getCompareItems,
  addToCompare,
  removeFromCompare,
  MAX_COMPARE,
} from '../utils/compareStorage'
import { showToast } from '../utils/toastBus'

export const ComparePage: React.FC = () => {
  const navigate = useNavigate()
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(
    getCompareItems()
  )

  // Keep in sync if compare list changes elsewhere (another tab, another page)
  useEffect(() => {
    const handler = () => setComparisonProducts(getCompareItems())
    window.addEventListener('compare-updated', handler)
    return () => window.removeEventListener('compare-updated', handler)
  }, [])

  const handleRemoveProduct = (productId: string) => {
    setComparisonProducts(removeFromCompare(productId))
  }

  const handleAddProduct = (product: Product) => {
    const result = addToCompare(product)
    if (result.status === 'full') {
      showToast(`You can compare up to ${MAX_COMPARE} products at a time`, 'error')
      return
    }
    setComparisonProducts(result.items)
  }

  const availableProducts = getCatalogProducts().filter(
    (p) => !comparisonProducts.find((cp) => cp.id === p.id)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
          <p className="text-gray-600">
            Compare up to 3 products side-by-side with AI-powered recommendations
          </p>
        </div>

        {/* Comparison Table */}
        {comparisonProducts.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
            <div className="relative overflow-x-auto">
              <div className="flex py-4 px-6 border-b border-gray-200 gap-4">
                <div className="w-48 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-600">Selected Products</p>
                </div>
                {comparisonProducts.map((product) => (
                  <div key={product.id} className="w-60 flex-shrink-0">
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="float-right p-1 hover:bg-red-50 text-red-600 rounded"
                    >
                      <X size={18} />
                    </button>
                    <div className="w-44">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-2"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = getCategoryFallbackImage(product.category)
                        }}
                      />
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Content */}
            <div className="p-6">
              <ProductComparison products={comparisonProducts} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mb-8">
            <p className="text-gray-600 mb-6">No products selected for comparison</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Products
            </button>
          </div>
        )}

        {/* Add More Products */}
        {comparisonProducts.length > 0 && comparisonProducts.length < MAX_COMPARE && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Plus size={24} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Add up to {MAX_COMPARE - comparisonProducts.length} more product to compare
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {availableProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <button
                    onClick={() => handleAddProduct(product)}
                    className="absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-blue-600"
                    title="Add to comparison"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Summary */}
        {comparisonProducts.length > 1 && (() => {
          const bestValue = [...comparisonProducts].sort(
            (a, b) => b.rating / b.price - a.rating / a.price
          )[0]
          const mostExpensive = [...comparisonProducts].sort((a, b) => b.price - a.price)[0]
          const cheapest = [...comparisonProducts].sort((a, b) => a.price - b.price)[0]

          return (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 AI Comparison Summary</h3>

              <div className="bg-white rounded-lg p-4 border-2 border-green-300 mb-4">
                <p className="font-semibold text-gray-900 mb-2">Best Overall Value</p>
                <p className="text-gray-700">
                  <strong>{bestValue.name}</strong> offers the best rating-to-price ratio
                  ({bestValue.rating}★ at ₹{bestValue.price.toLocaleString('en-IN')}) among the
                  products you're comparing.
                </p>
              </div>

              {mostExpensive.id !== bestValue.id && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Premium Alternative</p>
                  <p className="text-gray-700">
                    <strong>{mostExpensive.name}</strong> is the priciest option here, at ₹
                    {mostExpensive.price.toLocaleString('en-IN')}, if you want the most premium pick.
                  </p>
                </div>
              )}

              {cheapest.id !== bestValue.id && cheapest.id !== mostExpensive.id && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">Budget Option</p>
                  <p className="text-gray-700">
                    <strong>{cheapest.name}</strong> is the most affordable at ₹
                    {cheapest.price.toLocaleString('en-IN')}.
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => navigate(`/product/${bestValue.id}`)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  View Best Value
                </button>
                <button
                  onClick={() => {
                    addToCart(bestValue)
                    showToast(`${bestValue.name} added to cart`, 'success')
                    navigate('/cart')
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Add to Cart
                </button>
              </div>

            </div>
          )
        })()}
      </div>
    </div>
  )
}
