import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartItemComponent } from '../components/CartItemComponent'
import { CartItem } from '../types'
import {
  ShoppingCart,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react'
import {
  getCartItems,
  updateCartQuantity,
  removeFromCart,
} from '../utils/cartStorage'

export const CartPage: React.FC = () => {
  const navigate = useNavigate()

  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    setCartItems(getCartItems())
  }, [])

  const handleQuantityChange = (
    productId: string,
    quantity: number
  ) => {
    const updated = updateCartQuantity(productId, quantity)
    setCartItems(updated)
  }

  const handleRemoveItem = (productId: string) => {
    const updated = removeFromCart(productId)
    setCartItems(updated)
  }

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity,
    0
  )

  const discount = Math.floor(subtotal * 0.05)

  const taxableAmount = Math.max(
    0,
    subtotal - discount
  )

  const tax = Math.floor(taxableAmount * 0.18)

  const total = taxableAmount + tax

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart size={30} />
            Shopping Cart
          </h1>

          <p className="text-gray-500 mt-1">
            {cartItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            )}{' '}
            item(s) in your cart
          </p>
        </div>

        {/* Empty Cart */}
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
              <ShoppingBag
                size={38}
                className="text-blue-600"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>

            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything yet.
              Explore our products and find something you'll
              love.
            </p>

            <button
              onClick={() => navigate('/shop')}
              className="px-7 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItemComponent
                  key={item.productId}
                  item={item}
                  onQuantityChange={(qty) =>
                    handleQuantityChange(
                      item.productId,
                      qty
                    )
                  }
                  onRemove={() =>
                    handleRemoveItem(item.productId)
                  }
                />
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24 shadow-sm">
                <h3 className="font-bold text-xl text-gray-900 mb-5">
                  Order Summary
                </h3>

                <div className="space-y-3 border-t border-b border-gray-200 py-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Subtotal
                    </span>
                    <span className="font-medium">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Discount
                    </span>
                    <span className="font-medium text-green-600">
                      -₹{discount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      GST (18%)
                    </span>
                    <span className="font-medium">
                      ₹{tax.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-5">
                  <span className="font-bold text-gray-900">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-blue-600">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* AI Suggestion */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
                  <p className="text-sm font-bold text-blue-900 mb-1">
                    💡 AI Shopping Tip
                  </p>

                  <p className="text-xs text-blue-800">
                    You're saving ₹
                    {discount.toLocaleString('en-IN')} with
                    your current cart.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => navigate('/shop')}
                  className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Continue Shopping
                </button>

                <div className="text-xs text-gray-500 pt-5 mt-5 border-t border-gray-200 space-y-2">
                  <p>✓ Secure payment</p>
                  <p>✓ Easy returns</p>
                  <p>✓ Trusted merchants</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}