import { CartItem } from '../types'
import { Trash2, Minus, Plus } from 'lucide-react'
import { getCategoryFallbackImage } from '../utils/productImages'

interface CartItemComponentProps {
  item: CartItem
  onQuantityChange?: (quantity: number) => void
  onRemove?: () => void
}

export const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  return (
    <div className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4">
      {/* Image */}
      <img
        src={item.product.image}
        alt={item.product.name}
        className="w-24 h-24 object-cover rounded"
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = getCategoryFallbackImage(item.product.category)
        }}
      />

      {/* Details */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
        <p className="text-sm text-gray-600">{item.product.merchant.name}</p>
        <p className="text-lg font-bold text-gray-900 mt-2">
          ₹{item.product.price.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 h-fit">
        <button
          onClick={() => onQuantityChange?.(Math.max(1, item.quantity - 1))}
          className="text-gray-600 hover:text-gray-900"
        >
          <Minus size={16} />
        </button>
        <span className="w-6 text-center font-medium text-gray-900">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange?.(item.quantity + 1)}
          className="text-gray-600 hover:text-gray-900"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Total */}
      <div className="text-right">
        <p className="text-sm text-gray-600">Total</p>
        <p className="text-lg font-bold text-gray-900">
          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
