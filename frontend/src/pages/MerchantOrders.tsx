import { mockOrders } from '../utils/mockOrders'
import { ShoppingCart, X, Package } from 'lucide-react'
import { useState } from 'react'
import { Order } from '../types'

export const MerchantOrders: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)

  const filteredOrders = filterStatus
    ? mockOrders.filter((o) => o.status === filterStatus)
    : mockOrders

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={32} />
            Orders
          </h1>
          <p className="text-gray-600 mt-2">Track and manage all customer orders</p>
        </div>

        {/* Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {[
            { label: 'All', value: null, count: mockOrders.length },
            { label: 'Confirmed', value: 'confirmed', count: mockOrders.filter((o) => o.status === 'confirmed').length },
            { label: 'Shipped', value: 'shipped', count: mockOrders.filter((o) => o.status === 'shipped').length },
            { label: 'Delivered', value: 'delivered', count: mockOrders.filter((o) => o.status === 'delivered').length },
          ].slice(0, 3).map((stat) => (
            <button
              key={stat.value}
              onClick={() => setFilterStatus(stat.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                filterStatus === stat.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`text-sm font-medium ${filterStatus === stat.value ? 'text-blue-700' : 'text-gray-600'}`}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Products</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.createdAt.toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.items.length} item(s)
                      <br />
                      <span className="text-xs text-gray-600">
                        {order.items.map((item) => item.product.name).join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'confirmed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.paymentStatus === 'successful' ? '✓ Successful' : order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <p className="text-sm text-blue-900">
            💡 <strong>AI Insights:</strong> These orders were primarily influenced by AI recommendations. Good conversion rates indicate high-quality recommendations.
          </p>
        </div>
      </div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package size={22} />
                Order {viewingOrder.id}
              </h2>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close order details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Placed on</span>
                <span className="font-medium text-gray-900">
                  {viewingOrder.createdAt.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-900">{viewingOrder.customerId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-900 capitalize">{viewingOrder.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium text-gray-900 capitalize">
                  {viewingOrder.paymentStatus}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Items</p>
                <div className="space-y-3">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">
                    ₹{viewingOrder.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {viewingOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">
                      -₹{viewingOrder.discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">₹{viewingOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹{viewingOrder.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setViewingOrder(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
