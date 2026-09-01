import { Product } from '../types'
import { Check, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategoryFallbackImage } from '../utils/productImages'

interface ProductComparisonProps {
  products: Product[]
}

export const ProductComparison: React.FC<ProductComparisonProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No products to compare</p>
      </div>
    )
  }

  // Computed from real data, never a fixed/hardcoded pick - value score
  // rewards high rating at low price, so it genuinely reflects the products
  // actually being compared.
  const bestValueId = [...products].sort(
    (a, b) => b.rating / b.price - a.rating / a.price
  )[0]?.id
  const mostExpensiveId = [...products].sort((a, b) => b.price - a.price)[0]?.id
  const cheapestId = [...products].sort((a, b) => a.price - b.price)[0]?.id

  const getRecommendationText = (product: Product): string => {
    if (product.id === bestValueId) {
      return `Best value: ${product.rating}★ rating at ₹${product.price.toLocaleString('en-IN')}`
    }
    if (product.id === mostExpensiveId && mostExpensiveId !== bestValueId) {
      return 'Premium option - highest price in this comparison'
    }
    if (product.id === cheapestId && cheapestId !== bestValueId) {
      return 'Most budget-friendly option in this comparison'
    }
    return `Solid choice with a ${product.rating}★ rating`
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 z-10 bg-gray-50">
              Attribute
            </th>
            {products.map((product) => (
              <th
                key={product.id}
                className="border border-gray-200 px-6 py-4 text-center min-w-64"
              >
                <div>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded mb-4"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = getCategoryFallbackImage(product.category)
                    }}
                  />
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{product.name}</h3>
                  <p className="text-xs text-gray-600 mb-4">{product.merchant.name}</p>

                  <Link
                    to={`/product/${product.id}`}
                    className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price */}
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-200 px-6 py-4 font-semibold text-gray-900 sticky left-0 z-10 bg-white">
              Price
            </td>
            {products.map((product) => (
              <td key={product.id} className="border border-gray-200 px-6 py-4 text-center">
                <p className="text-lg font-bold text-gray-900">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
                {product.originalPrice && (
                  <p className="text-xs text-gray-500 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </p>
                )}
              </td>
            ))}
          </tr>

          {/* Rating */}
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-200 px-6 py-4 font-semibold text-gray-900 sticky left-0 z-10 bg-white">
              Rating
            </td>
            {products.map((product) => (
              <td key={product.id} className="border border-gray-200 px-6 py-4 text-center">
                <p className="text-lg font-bold text-yellow-500">⭐ {product.rating}</p>
                <p className="text-xs text-gray-600">({product.reviewCount} reviews)</p>
              </td>
            ))}
          </tr>

          {/* Availability */}
          <tr className="hover:bg-gray-50">
            <td className="border border-gray-200 px-6 py-4 font-semibold text-gray-900 sticky left-0 z-10 bg-white">
              Availability
            </td>
            {products.map((product) => (
              <td key={product.id} className="border border-gray-200 px-6 py-4 text-center">
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                    product.availability === 'In Stock'
                      ? 'bg-green-100 text-green-800'
                      : product.availability === 'Limited'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.availability}
                </span>
              </td>
            ))}
          </tr>

          {/* Features */}
          {Math.max(...products.map((p) => p.features.length)) > 0 && (
            <tr className="hover:bg-gray-50">
              <td className="border border-gray-200 px-6 py-4 font-semibold text-gray-900 sticky left-0 z-10 bg-white">
                Key Features
              </td>
              {products.map((product) => (
                <td key={product.id} className="border border-gray-200 px-6 py-4">
                  <ul className="space-y-1">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex gap-2">
                        <Check size={14} className="text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          )}

          {/* AI Recommendation */}
          <tr className="bg-blue-50 hover:bg-blue-100">
            <td className="border border-gray-200 px-6 py-4 font-semibold text-gray-900 sticky left-0 z-10 bg-blue-50">
              <Zap size={16} className="inline text-blue-600 mr-2" />
              AI Recommendation
            </td>
            {products.map((product) => (
              <td key={product.id} className="border border-gray-200 px-6 py-4 text-center">
                <div className="bg-blue-100 text-blue-900 rounded px-3 py-2 text-xs">
                  {getRecommendationText(product)}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
