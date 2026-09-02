import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Filter,
  Grid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import { ProductCard } from '../components/ProductCard'
import { Product } from '../types'
import { addToCart } from '../utils/cartStorage'
import { addToCompare } from '../utils/compareStorage'
import { showToast } from '../utils/toastBus'
import { deriveProductsPageFilters } from '../utils/aiEngine'
import { getProductImage } from '../utils/productImages'

import {
  getProducts,
  BackendProduct,
} from '../services/productService'

import { saveCatalogProducts } from '../utils/catalogStorage'

interface ProductsPageNavState {
  query?: string
}

const convertBackendProduct = (
  backendProduct: BackendProduct
): Product => {
  let availability: Product['availability'] = 'In Stock'

  if (backendProduct.stock <= 0) {
    availability = 'Out of Stock'
  } else if (backendProduct.stock <= 5) {
    availability = 'Limited'
  }

  const price = Number(backendProduct.price)
  const rating = Number(backendProduct.rating)

  return {
    id: String(backendProduct.id),

    name: backendProduct.name,

    price,

    originalPrice: undefined,

    rating,

    reviewCount: Math.floor(rating * 100),

    image: getProductImage(
      backendProduct.name,
      backendProduct.category
    ),

    description:
      backendProduct.description ||
      `${backendProduct.name} from RazorCart AI marketplace`,

    availability,

    category: backendProduct.category,

    features: [],

    merchant: {
      id: String(backendProduct.merchant_id),

      name: `Merchant ${backendProduct.merchant_id}`,

      logo: '',

      rating,

      verified: true,
    },

    sku: `SKU-${backendProduct.id}`,
  }
}

export const ProductsPage: React.FC = () => {
  const location = useLocation()

  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] =
    useState<'grid' | 'list'>('grid')

  const [sortBy, setSortBy] = useState<
    'relevance' | 'price-low' | 'price-high' | 'rating'
  >('relevance')

  const [selectedCategory, setSelectedCategory] =
    useState<string>('All')

  const [priceRange, setPriceRange] = useState<
    [number, number]
  >([0, 150000])

  const [filterOpen, setFilterOpen] = useState(false)

  const [catalogProducts, setCatalogProducts] =
    useState<Product[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(
    null
  )

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getProducts({
        skip: 0,
        limit: 100,
      })

      const convertedProducts = data.items.map(
        convertBackendProduct
      )

      // IMPORTANT:
      // Backend products ko local catalog mein save kar rahe hain
      // taaki ProductDetailsPage bhi same products access kar sake.
      saveCatalogProducts(convertedProducts)

      setCatalogProducts(convertedProducts)
    } catch (err) {
      console.error(
        'Failed to load products:',
        err
      )

      setError(
        'Unable to load products from the backend. Please check that the backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const state =
      location.state as ProductsPageNavState | null

    if (!state?.query) return

    const derived = deriveProductsPageFilters(
      state.query
    )

    setSelectedCategory(derived.category)
    setSearch(derived.search)

    if (derived.maxPrice !== null) {
      setPriceRange([0, derived.maxPrice])
    }
  }, [location.state])

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        catalogProducts.map(
          (product) => product.category
        )
      )
    )

    return ['All', ...uniqueCategories]
  }, [catalogProducts])

  const filteredProducts = useMemo(() => {
    let result = [...catalogProducts]

    // Search
    if (search.trim()) {
      const query = search.toLowerCase().trim()

      result = result.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(query) ||
          product.category
            .toLowerCase()
            .includes(query) ||
          product.merchant.name
            .toLowerCase()
            .includes(query)
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (product) =>
          product.category === selectedCategory
      )
    }

    // Price filter
    result = result.filter(
      (product) =>
        product.price >= priceRange[0] &&
        product.price <= priceRange[1]
    )

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort(
          (a, b) => a.price - b.price
        )
        break

      case 'price-high':
        result.sort(
          (a, b) => b.price - a.price
        )
        break

      case 'rating':
        result.sort(
          (a, b) => b.rating - a.rating
        )
        break

      default:
        break
    }

    return result
  }, [
    search,
    selectedCategory,
    priceRange,
    sortBy,
    catalogProducts,
  ])

  const handleAddToCart = (
    product: Product
  ) => {
    addToCart(product)

    showToast(
      `${product.name} added to cart`,
      'success'
    )
  }

  const handleCompare = (
    product: Product
  ) => {
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

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('All')
    setPriceRange([0, 150000])
    setSortBy('relevance')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white">

        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-300 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          <div className="max-w-3xl">

            <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-2">
              RazorCart AI Marketplace
            </p>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Discover products
              <span className="text-cyan-300">
                {' '}you'll love.
              </span>
            </h1>

            <p className="text-blue-100 text-lg">
              Search, compare and shop smarter with AI-powered recommendations.
            </p>

          </div>

          {/* Search */}
          <div className="mt-8 max-w-4xl">

            <div className="bg-white rounded-2xl p-2 shadow-2xl flex items-center gap-2">

              <div className="flex-1 relative">

                <Search
                  size={21}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-transparent outline-none rounded-xl"
                />

              </div>

              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="p-2 text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <X size={20} />
                </button>
              )}

              <button
                onClick={() => setSearch(search)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Search
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Categories */}
        <div className="mb-8">

          <div className="flex items-center justify-between mb-3">

            <h2 className="text-lg font-bold text-gray-900">
              Shop by category
            </h2>

            <span className="text-sm text-gray-500">
              {filteredProducts.length} products
            </span>

          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">

            {categories.map((category) => (

              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {category}
              </button>

            ))}

          </div>

        </div>

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div>

              <p className="text-sm text-gray-500">
                Showing
              </p>

              <p className="font-bold text-gray-900">
                {filteredProducts.length} products
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <button
                onClick={() =>
                  setFilterOpen(true)
                }
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <SlidersHorizontal size={17} />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'relevance'
                      | 'price-low'
                      | 'price-high'
                      | 'rating'
                  )
                }
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="relevance">
                  Sort: Relevance
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="rating">
                  Highest Rated
                </option>

              </select>

              <div className="flex border border-gray-200 rounded-lg overflow-hidden">

                <button
                  onClick={() =>
                    setViewMode('grid')
                  }
                  className={`p-2.5 ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Grid size={18} />
                </button>

                <button
                  onClick={() =>
                    setViewMode('list')
                  }
                  className={`p-2.5 ${
                    viewMode === 'list'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <List size={18} />
                </button>

              </div>

              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-blue-600"
              >
                Clear all
              </button>

            </div>

          </div>

        </div>

        <div className="flex gap-8">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">

            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24 shadow-sm">

              <div className="flex items-center gap-2 mb-6">

                <Filter
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="font-bold text-gray-900">
                  Filters
                </h2>

              </div>

              {/* Categories */}
              <div className="mb-7">

                <h3 className="font-semibold text-gray-900 mb-3">
                  Category
                </h3>

                <div className="space-y-1">

                  {categories.map((category) => (

                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(category)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedCategory === category
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>

                  ))}

                </div>

              </div>

              {/* Price Range */}
              <div>

                <h3 className="font-semibold text-gray-900 mb-4">
                  Price Range
                </h3>

                <input
                  type="range"
                  min="0"
                  max="150000"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([
                      Math.min(
                        Number(e.target.value),
                        priceRange[1]
                      ),
                      priceRange[1],
                    ])
                  }
                  className="w-full"
                />

                <input
                  type="range"
                  min="0"
                  max="150000"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      Math.max(
                        Number(e.target.value),
                        priceRange[0]
                      ),
                    ])
                  }
                  className="w-full mt-2"
                />

                <div className="flex justify-between mt-3 text-sm font-medium text-gray-600">

                  <span>
                    ₹{priceRange[0].toLocaleString('en-IN')}
                  </span>

                  <span>
                    ₹{priceRange[1].toLocaleString('en-IN')}
                  </span>

                </div>

              </div>

            </div>

          </aside>

          {/* Product Section */}
          <section className="flex-1">

            {loading ? (

              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">

                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-5" />

                <h2 className="text-xl font-bold text-gray-900">
                  Loading products...
                </h2>

                <p className="text-gray-500 mt-2">
                  Fetching products from the backend.
                </p>

              </div>

            ) : error ? (

              <div className="bg-white rounded-2xl border border-red-200 p-16 text-center">

                <h2 className="text-xl font-bold text-red-600 mb-3">
                  Unable to load products
                </h2>

                <p className="text-gray-500 mb-6">
                  {error}
                </p>

                <button
                  onClick={loadProducts}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Try Again
                </button>

              </div>

            ) : filteredProducts.length === 0 ? (

              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">

                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-50 flex items-center justify-center">

                  <Search
                    size={28}
                    className="text-blue-500"
                  />

                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No products found
                </h2>

                <p className="text-gray-500 mb-6">
                  Try a different search or adjust your filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Clear Filters
                </button>

              </div>

            ) : (

              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >

                {filteredProducts.map((product) => (

                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onCompare={handleCompare}
                  />

                ))}

              </div>

            )}

          </section>

        </div>

      </div>

      {/* Mobile Filter Drawer */}
      {filterOpen && (

        <div className="fixed inset-0 z-[100] lg:hidden">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={() =>
              setFilterOpen(false)
            }
          />

          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white p-6 shadow-2xl overflow-y-auto">

            <div className="flex items-center justify-between mb-8">

              <div className="flex items-center gap-2">

                <SlidersHorizontal
                  size={20}
                  className="text-blue-600"
                />

                <h2 className="text-xl font-bold">
                  Filters
                </h2>

              </div>

              <button
                onClick={() =>
                  setFilterOpen(false)
                }
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>

            </div>

            <h3 className="font-semibold mb-3">
              Category
            </h3>

            <div className="space-y-1 mb-8">

              {categories.map((category) => (

                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`w-full text-left px-3 py-2.5 rounded-lg ${
                    selectedCategory === category
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>

              ))}

            </div>

            <h3 className="font-semibold mb-4">
              Price Range
            </h3>

            <input
              type="range"
              min="0"
              max="150000"
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange([
                  Math.min(
                    Number(e.target.value),
                    priceRange[1]
                  ),
                  priceRange[1],
                ])
              }
              className="w-full"
            />

            <input
              type="range"
              min="0"
              max="150000"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([
                  priceRange[0],
                  Math.max(
                    Number(e.target.value),
                    priceRange[0]
                  ),
                ])
              }
              className="w-full mt-3"
            />

            <div className="flex justify-between mt-3 text-sm text-gray-600">

              <span>
                ₹{priceRange[0].toLocaleString('en-IN')}
              </span>

              <span>
                ₹{priceRange[1].toLocaleString('en-IN')}
              </span>

            </div>

            <button
              onClick={() =>
                setFilterOpen(false)
              }
              className="w-full mt-8 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              Apply Filters
            </button>

          </div>

        </div>

      )}

    </div>
  )
}