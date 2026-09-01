import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { getCatalogProducts } from '../utils/catalogStorage'
import { ProductCard } from '../components/ProductCard'
import { Product } from '../types'
import { addToCart } from '../utils/cartStorage'
import { showToast } from '../utils/toastBus'

export const ShopPage: React.FC = () => {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>(() => getCatalogProducts())

  useEffect(() => {
    const handler = () => setProducts(getCatalogProducts())
    window.addEventListener('catalog-updated', handler)
    return () => window.removeEventListener('catalog-updated', handler)
  }, [])

  const popularSearches = [
    'Laptop under ₹60,000',
    'Gaming headphones',
    'Smartwatch',
    'Home appliances',
    'Fashion',
  ]

  const searchResults = useMemo(() => {
    if (!search.trim()) {
      return []
    }

    const query = search.toLowerCase()

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.merchant.name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [search, products])

  const handleSearch = (value = search) => {
    if (!value.trim()) return

    navigate('/products', {
      state: {
        query: value,
      },
    })
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    showToast(`${product.name} added to cart`, 'success')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          <div className="max-w-3xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
              <Sparkles size={16} />
              AI-powered shopping
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              What are you looking for today?
            </h1>

            <p className="mt-4 text-blue-100 text-lg">
              Search products normally or describe what you
              need. Our AI will help you find the right option.
            </p>

            {/* Search */}
            <div className="mt-8 bg-white rounded-2xl p-2 shadow-2xl flex items-center">
              <Search
                size={22}
                className="text-gray-400 ml-3"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                placeholder="Search laptops, headphones, fashion, home..."
                className="flex-1 px-4 py-3 text-gray-900 outline-none bg-transparent"
              />

              <button
                onClick={() => handleSearch()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
              >
                Search
              </button>
            </div>

            {/* Popular searches */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {popularSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setSearch(item)
                    handleSearch(item)
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm hover:bg-white/20"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {search.trim() && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {searchResults.length} products found
              </p>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {searchResults
                .slice(0, 8)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Search
                size={40}
                className="mx-auto text-gray-300 mb-4"
              />

              <h3 className="text-xl font-bold">
                No matching products
              </h3>

              <p className="text-gray-500 mt-2">
                Try a different product or category.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Features */}
      {!search.trim() && (
        <>
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <Sparkles
                    size={22}
                    className="text-blue-600"
                  />
                </div>

                <h3 className="font-bold text-gray-900">
                  AI Recommendations
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Tell us what you need and get personalized
                  product suggestions.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center mb-4">
                  <ShieldCheck
                    size={22}
                    className="text-green-600"
                  />
                </div>

                <h3 className="font-bold text-gray-900">
                  Trusted Shopping
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Compare products, merchants, prices and
                  ratings before buying.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                  <Zap
                    size={22}
                    className="text-purple-600"
                  />
                </div>

                <h3 className="font-bold text-gray-900">
                  Fast Discovery
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Quickly find the right products without
                  browsing hundreds of pages.
                </p>
              </div>
            </div>
          </section>

          {/* Trending */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp
                    size={21}
                    className="text-blue-600"
                  />

                  <h2 className="text-2xl font-bold text-gray-900">
                    Trending Now
                  </h2>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Popular products shoppers are checking out
                </p>
              </div>

              <button
                onClick={() => navigate('/products')}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600"
              >
                View all
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}