import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  X,
  Save,
  Image as ImageIcon,
} from 'lucide-react'
import { Product } from '../types'
import { getCatalogProducts, saveCatalogProducts } from '../utils/catalogStorage'
import { showToast } from '../utils/toastBus'
import { recordAuditEvent } from '../utils/auditStorage'

interface ProductForm {
  name: string
  sku: string
  category: string
  price: string
  originalPrice: string
  availability: 'In Stock' | 'Limited' | 'Out of Stock'
  rating: string
  reviewCount: string
  image: string
  merchantName: string
}

const defaultForm: ProductForm = {
  name: '',
  sku: '',
  category: '',
  price: '',
  originalPrice: '',
  availability: 'In Stock',
  rating: '4.5',
  reviewCount: '0',
  image: '',
  merchantName: 'RazorCart Merchant',
}

export const MerchantCatalog: React.FC = () => {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() =>
    getCatalogProducts()
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(defaultForm)

  // Save catalog
  useEffect(() => {
    saveCatalogProducts(catalogProducts)
  }, [catalogProducts])

  // Search
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return catalogProducts
    }

    return catalogProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      )
    })
  }, [catalogProducts, searchTerm])

  // Stats
  const inStockCount = catalogProducts.filter(
    (product) => product.availability === 'In Stock'
  ).length

  const limitedCount = catalogProducts.filter(
    (product) => product.availability === 'Limited'
  ).length

  // Open add modal
  const handleAddProduct = () => {
    setEditingProduct(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  // Open edit modal
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      originalPrice: product.originalPrice
        ? String(product.originalPrice)
        : '',
      availability: product.availability,
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      image: product.image || '',
      merchantName: product.merchant.name,
    })

    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setForm(defaultForm)
  }

  // Form change
  const updateForm = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  // Save product
  const handleSaveProduct = () => {
    if (
      !form.name.trim() ||
      !form.sku.trim() ||
      !form.category.trim() ||
      !form.price.trim()
    ) {
      showToast('Please enter Product Name, SKU, Category and Price.', 'error')
      return
    }

    const price = Number(form.price)

    if (!Number.isFinite(price) || price <= 0) {
      showToast('Please enter a valid price.', 'error')
      return
    }

    const originalPrice = form.originalPrice.trim()
      ? Number(form.originalPrice)
      : undefined

    if (
      form.originalPrice.trim() &&
      (!Number.isFinite(originalPrice) ||
        (originalPrice ?? 0) <= 0)
    ) {
      showToast('Please enter a valid original price.', 'error')
      return
    }

    // EDIT EXISTING PRODUCT
    if (editingProduct) {
      setCatalogProducts((previousProducts) =>
        previousProducts.map((product) => {
          if (product.id !== editingProduct.id) {
            return product
          }

          return {
            ...product,
            name: form.name.trim(),
            sku: form.sku.trim(),
            category: form.category.trim(),
            price: price,
            originalPrice: originalPrice,
            availability: form.availability,
            rating: Number(form.rating) || 0,
            reviewCount: Number(form.reviewCount) || 0,

            // Keep old image if no new image is entered
            image: form.image.trim() || product.image,

            merchant: {
              ...product.merchant,
              name:
                form.merchantName.trim() ||
                product.merchant.name,
            },
          }
        })
      )

      closeModal()
      showToast(`${form.name.trim()} updated`, 'success')
      recordAuditEvent({
        type: 'product',
        description: `Merchant edited product "${form.name.trim()}"`,
        actor: 'merchant',
        status: 'success',
        metadata: { productId: editingProduct.id },
      })
      return
    }

    // ADD NEW PRODUCT
    const newProduct = {
      id: `merchant-${Date.now()}`,
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      price: price,
      originalPrice: originalPrice,
      availability: form.availability,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,

      // Image URL
      image:
        form.image.trim() ||
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',

      merchant: {
        name:
          form.merchantName.trim() ||
          'AI Commerce Store',
      },
    } as Product

    setCatalogProducts((previousProducts) => [
      newProduct,
      ...previousProducts,
    ])

    closeModal()
    showToast(`${newProduct.name} added to catalog`, 'success')
    recordAuditEvent({
      type: 'product',
      description: `Merchant added new product "${newProduct.name}"`,
      actor: 'merchant',
      status: 'success',
      metadata: { productId: newProduct.id, category: newProduct.category },
    })
  }

  // Delete
  const handleDeleteProduct = (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    )

    if (!confirmed) {
      return
    }

    setCatalogProducts((previousProducts) =>
      previousProducts.filter(
        (item) => item.id !== product.id
      )
    )
    showToast(`${product.name} deleted from catalog`, 'success')
    recordAuditEvent({
      type: 'product',
      description: `Merchant deleted product "${product.name}"`,
      actor: 'merchant',
      status: 'success',
      metadata: { productId: product.id },
    })

    if (viewingProduct?.id === product.id) {
      setViewingProduct(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Package
                size={25}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Catalog
              </h1>

              <p className="text-gray-500 mt-1">
                Manage your AI-searchable product inventory
              </p>
            </div>

          </div>

          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={19} />
            Add Product
          </button>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Products
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {catalogProducts.length}
            </p>

            <p className="text-xs text-blue-600 mt-2">
              AI searchable catalog
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              In Stock
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {inStockCount}
            </p>

            <p className="text-xs text-green-600 mt-2">
              Available for customers
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Limited Stock
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {limitedCount}
            </p>

            <p className="text-xs text-orange-600 mt-2">
              Needs attention
            </p>
          </div>

        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">

          <div className="relative">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search by product, SKU or category..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />

          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50 border-b border-gray-200">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Product
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    SKU
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Price
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Stock
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    AI Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredProducts.map((product) => (

                  <tr
                    key={product.id}
                    className="hover:bg-blue-50/40 transition"
                  >

                    {/* PRODUCT */}
                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3 min-w-[260px]">

                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                          onError={(event) => {
                            event.currentTarget.src =
                              'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
                          }}
                        />

                        <div>

                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {product.category}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {product.sku}
                    </td>

                    {/* PRICE */}
                    <td className="px-6 py-4">

                      <span className="font-bold text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>

                    </td>

                    {/* STOCK */}
                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          product.availability === 'In Stock'
                            ? 'bg-green-100 text-green-700'
                            : product.availability === 'Limited'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.availability}
                      </span>

                    </td>

                    {/* AI */}
                    <td className="px-6 py-4">

                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        ✓ Indexed
                      </span>

                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            setViewingProduct(product)
                          }
                          title="View"
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleEditProduct(product)
                          }
                          title="Edit"
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700 transition"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteProduct(product)
                          }
                          title="Delete"
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            {filteredProducts.length === 0 && (
              <div className="py-16 text-center">

                <Package
                  size={42}
                  className="mx-auto text-gray-300 mb-3"
                />

                <h3 className="font-semibold text-gray-800">
                  No products found
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Try another search or add a new product.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-6 border-b">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add New Product'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add product details for AI-powered discovery
                </p>

              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* NAME */}
              <div className="md:col-span-2">

                <label className="text-sm font-semibold text-gray-700">
                  Product Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="Samsung Galaxy S25"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* SKU */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  SKU
                </label>

                <input
                  value={form.sku}
                  onChange={(event) =>
                    updateForm(
                      'sku',
                      event.target.value
                    )
                  }
                  placeholder="PHONE-001"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* CATEGORY */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Category
                </label>

                <input
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      'category',
                      event.target.value
                    )
                  }
                  placeholder="Phones"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* PRICE */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Price (₹)
                </label>

                <input
                  type="number"
                  value={form.price}
                  onChange={(event) =>
                    updateForm(
                      'price',
                      event.target.value
                    )
                  }
                  placeholder="49999"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* ORIGINAL PRICE */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Original Price (₹)
                </label>

                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={(event) =>
                    updateForm(
                      'originalPrice',
                      event.target.value
                    )
                  }
                  placeholder="54999"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* AVAILABILITY */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Availability
                </label>

                <select
                  value={form.availability}
                  onChange={(event) =>
                    updateForm(
                      'availability',
                      event.target.value
                    )
                  }
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="In Stock">
                    In Stock
                  </option>

                  <option value="Limited">
                    Limited
                  </option>

                  <option value="Out of Stock">
                    Out of Stock
                  </option>
                </select>

              </div>

              {/* RATING */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Rating
                </label>

                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) =>
                    updateForm(
                      'rating',
                      event.target.value
                    )
                  }
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* REVIEWS */}
              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Review Count
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.reviewCount}
                  onChange={(event) =>
                    updateForm(
                      'reviewCount',
                      event.target.value
                    )
                  }
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* IMAGE */}
              <div className="md:col-span-2">

                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon size={16} />
                  Product Image URL
                </label>

                <input
                  type="text"
                  value={form.image}
                  onChange={(event) =>
                    updateForm(
                      'image',
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/product-image.jpg"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

                {form.image.trim() && (
                  <div className="mt-3">

                    <img
                      src={form.image}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-xl border"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none'
                      }}
                    />

                  </div>
                )}

              </div>

              {/* MERCHANT */}
              <div className="md:col-span-2">

                <label className="text-sm font-semibold text-gray-700">
                  Merchant Name
                </label>

                <input
                  value={form.merchantName}
                  onChange={(event) =>
                    updateForm(
                      'merchantName',
                      event.target.value
                    )
                  }
                  placeholder="AI Commerce Store"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">

              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveProduct}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold flex items-center gap-2"
              >
                <Save size={17} />

                {editingProduct
                  ? 'Save Changes'
                  : 'Add Product'}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* VIEW MODAL */}
      {viewingProduct && (

        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

            <div className="relative">

              <img
                src={viewingProduct.image}
                alt={viewingProduct.name}
                className="w-full h-64 object-cover"
                onError={(event) => {
                  event.currentTarget.src =
                    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
                }}
              />

              <button
                onClick={() => setViewingProduct(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white shadow"
              >
                <X size={19} />
              </button>

            </div>

            <div className="p-6">

              <p className="text-sm text-blue-600 font-semibold">
                {viewingProduct.category}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {viewingProduct.name}
              </h2>

              <div className="flex items-center gap-2 mt-3">

                <span className="text-yellow-500">
                  ★
                </span>

                <span className="font-semibold">
                  {viewingProduct.rating}
                </span>

                <span className="text-gray-500 text-sm">
                  ({viewingProduct.reviewCount} reviews)
                </span>

              </div>

              <div className="mt-5 p-4 bg-blue-50 rounded-xl">

                <p className="text-2xl font-bold text-gray-900">
                  ₹
                  {viewingProduct.price.toLocaleString(
                    'en-IN'
                  )}
                </p>

                {viewingProduct.originalPrice && (
                  <p className="text-sm text-gray-500 line-through">
                    ₹
                    {viewingProduct.originalPrice.toLocaleString(
                      'en-IN'
                    )}
                  </p>
                )}

              </div>

              <div className="mt-4 flex justify-between">

                <span className="text-sm text-gray-500">
                  SKU
                </span>

                <span className="text-sm font-mono">
                  {viewingProduct.sku}
                </span>

              </div>

              <div className="mt-3 flex justify-between">

                <span className="text-sm text-gray-500">
                  Availability
                </span>

                <span className="font-semibold">
                  {viewingProduct.availability}
                </span>

              </div>

              <div className="mt-3 flex justify-between">

                <span className="text-sm text-gray-500">
                  Merchant
                </span>

                <span className="font-semibold">
                  {viewingProduct.merchant.name}
                </span>

              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  to={`/product/${viewingProduct.id}`}
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 py-3 text-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                >
                  View Full Page
                </Link>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Close
                </button>
              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}
