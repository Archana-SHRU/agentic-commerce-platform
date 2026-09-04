import { DashboardCard } from '../components/DashboardCard'
import { mockMerchantStats, mockOrders } from '../utils/mockOrders'
import { getCatalogProducts } from '../utils/catalogStorage'
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  MessageCircle,
  Package,
  Brain,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchMerchantProfile, fetchMerchantOrders } from '../services/merchantService'

export const MerchantDashboard: React.FC = () => {
  const [products, setProducts] = useState(() => getCatalogProducts())
  const [merchantName, setMerchantName] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handler = () => setProducts(getCatalogProducts())
    window.addEventListener('catalog-updated', handler)
    return () => window.removeEventListener('catalog-updated', handler)
  }, [])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [merchant, ordersData] = await Promise.all([
          fetchMerchantProfile(),
          fetchMerchantOrders(),
        ])

        setMerchantName(merchant.name)
        setOrders(ordersData.items)
      } catch (error) {
        console.error('Failed to load merchant dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const totalProducts = products.length
  const lowStockCount = products.filter(
    (p) => p.availability === 'Limited' || p.availability === 'Out of Stock'
  ).length
  // All catalog products are searchable by the AI shopping assistant
  // (see utils/aiEngine.ts, which reads live from the same catalog).
  const aiIndexedCount = products.filter((p) => p.availability !== 'Out of Stock').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={32} />
            Merchant Dashboard
          </h1>
          <p className="text-gray-600 mt-2">{loading ? 'Loading your dashboard...' : `Welcome back, ${merchantName}! Here's your performance overview.`}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <DashboardCard
            title="Total Revenue"
            value={mockMerchantStats.totalRevenue}
            valueFormat="currency"
            trend={12}
            icon={<TrendingUp className="text-blue-600" size={24} />}
          />
          <DashboardCard
            title="Total Orders"
            value={orders.length}
            valueFormat="number"
            trend={15}
            icon={<ShoppingCart className="text-green-600" size={24} />}
          />
          <DashboardCard
            title="Total Products"
            value={totalProducts}
            valueFormat="number"
            description="In your catalog"
            icon={<Package className="text-indigo-600" size={24} />}
          />
          <DashboardCard
            title="Low Stock"
            value={lowStockCount}
            valueFormat="number"
            description="Limited or out of stock"
            icon={<AlertCircle className="text-red-600" size={24} />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <DashboardCard
            title="AI Indexed Products"
            value={aiIndexedCount}
            valueFormat="number"
            description="Searchable by AI assistant"
            icon={<Brain className="text-purple-600" size={24} />}
          />
          <DashboardCard
            title="AI Generated Revenue"
            value={mockMerchantStats.aiGeneratedRevenue}
            valueFormat="currency"
            trend={28}
            icon={<TrendingUp className="text-purple-600" size={24} />}
          />
          <DashboardCard
            title="Conversion Rate"
            value={mockMerchantStats.conversionRate}
            valueFormat="percentage"
            trend={3}
            icon={<BarChart3 className="text-amber-600" size={24} />}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <DashboardCard
            title="Average Order Value"
            value={mockMerchantStats.averageOrderValue}
            valueFormat="currency"
            description="Per transaction"
          />
          <DashboardCard
            title="Upsell Revenue"
            value={mockMerchantStats.upsellRevenue}
            valueFormat="currency"
            trend={42}
          />
          <DashboardCard
            title="Failed Payments"
            value={mockMerchantStats.failedPayments}
            valueFormat="number"
            description="Need retry"
            icon={<AlertCircle className="text-red-600" size={24} />}
          />
          <DashboardCard
            title="Support Handoffs"
            value={mockMerchantStats.supportHandoffs}
            valueFormat="number"
            description="To human experts"
            icon={<MessageCircle className="text-cyan-600" size={24} />}
          />
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Top Performing Products */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Top Performing Products</h3>
            <div className="space-y-4">
              {mockMerchantStats.topProducts?.slice(0, 5).map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{idx + 1}. {product.name}</p>
                    <p className="text-xs text-gray-600">⭐ {product.rating} • ₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="font-bold text-blue-600">#{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💡 AI Insights</h3>
            <div className="space-y-3">
              <div className="bg-white rounded p-3 border-l-4 border-blue-600">
                <p className="font-medium text-gray-900 text-sm">Revenue Spike Detected</p>
                <p className="text-xs text-gray-600 mt-1">
                  AI-recommended products generated 57.8% of revenue this month
                </p>
              </div>
              <div className="bg-white rounded p-3 border-l-4 border-green-600">
                <p className="font-medium text-gray-900 text-sm">Conversion Trend</p>
                <p className="text-xs text-gray-600 mt-1">
                  Conversion rate improved by 3% after AI optimization
                </p>
              </div>
              <div className="bg-white rounded p-3 border-l-4 border-amber-600">
                <p className="font-medium text-gray-900 text-sm">Action Recommended</p>
                <p className="text-xs text-gray-600 mt-1">
                  Restock 3 products before they run out based on demand forecast
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent AI-Generated Orders</h3>
            <Link to="/merchant/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {mockOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-gray-900">{order.id}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Success
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/merchant/catalog"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow text-center"
          >
            <span className="text-3xl mb-4 block">📦</span>
            <h3 className="font-bold text-gray-900 mb-2">Manage Catalog</h3>
            <p className="text-sm text-gray-600">Update products and inventory</p>
          </Link>

          <Link
            to="/merchant/orders"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow text-center"
          >
            <span className="text-3xl mb-4 block">📋</span>
            <h3 className="font-bold text-gray-900 mb-2">View Orders</h3>
            <p className="text-sm text-gray-600">Track and manage all orders</p>
          </Link>

          <Link
            to="/merchant/audit-trail"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow text-center"
          >
            <span className="text-3xl mb-4 block">📊</span>
            <h3 className="font-bold text-gray-900 mb-2">Audit Trail</h3>
            <p className="text-sm text-gray-600">Review all transactions and interactions</p>
          </Link>
        </div>
      </div>
    </div>
  )
}





