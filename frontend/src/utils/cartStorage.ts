import { CartItem, Product } from '../types'

const CART_KEY = 'ai_commerce_cart'

export const getCartItems = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_KEY)

    if (!stored) {
      return []
    }

    return JSON.parse(stored)
  } catch {
    return []
  }
}

export const saveCartItems = (items: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items))

  // Notify other components in the same tab
  window.dispatchEvent(new Event('cart-updated'))
}

export const addToCart = (product: Product, quantity = 1): CartItem[] => {
  const cart = getCartItems()

  const existing = cart.find((item) => item.productId === product.id)

  let updatedCart: CartItem[]

  if (existing) {
    updatedCart = cart.map((item) =>
      item.productId === product.id
        ? {
            ...item,
            quantity: item.quantity + quantity,
          }
        : item
    )
  } else {
    updatedCart = [
      ...cart,
      {
        productId: product.id,
        product,
        quantity,
        addedAt: new Date(),
      },
    ]
  }

  saveCartItems(updatedCart)

  return updatedCart
}

export const updateCartQuantity = (
  productId: string,
  quantity: number
): CartItem[] => {
  const cart = getCartItems()

  if (quantity <= 0) {
    return removeFromCart(productId)
  }

  const updatedCart = cart.map((item) =>
    item.productId === productId
      ? { ...item, quantity }
      : item
  )

  saveCartItems(updatedCart)

  return updatedCart
}

export const removeFromCart = (productId: string): CartItem[] => {
  const cart = getCartItems()

  const updatedCart = cart.filter(
    (item) => item.productId !== productId
  )

  saveCartItems(updatedCart)

  return updatedCart
}

export const clearCart = () => {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

export const getCartCount = (): number => {
  return getCartItems().reduce(
    (total, item) => total + item.quantity,
    0
  )
}