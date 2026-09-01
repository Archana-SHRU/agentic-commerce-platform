export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  description: string
  availability: 'In Stock' | 'Out of Stock' | 'Limited'
  category: string
  features: string[]
  merchant: Merchant
  sku: string
}

export interface Merchant {
  id: string
  name: string
  logo: string
  rating: number
  verified: boolean
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
  addedAt: Date
}

export interface ComparisonProduct {
  product: Product
  pros: string[]
  cons: string[]
  aiReason?: string
}

export interface Order {
  id: string
  customerId: string
  items: OrderItem[]
  total: number
  subtotal: number
  discount: number
  tax: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'processing' | 'successful' | 'failed'
  createdAt: Date
  estimatedDelivery?: Date
  merchant: Merchant
}

export interface OrderItem {
  productId: string
  product: Product
  quantity: number
  price: number
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: Date
  suggestions?: string[]
  products?: Product[]
}

export interface SupportAgent {
  id: string
  name: string
  avatar: string
  status: 'available' | 'busy' | 'offline'
  specialism?: string
  rating: number
}

export interface SupportConversation {
  id: string
  customerId: string
  agent?: SupportAgent
  messages: ChatMessage[]
  status: 'open' | 'closed' | 'escalated'
  createdAt: Date
  resolvedAt?: Date
  type: 'chat' | 'voice' | 'video'
}

export interface AuditEvent {
  id: string
  timestamp: Date
  type: 'request' | 'search' | 'recommendation' | 'approval' | 'order' | 'payment' | 'support' | 'error' | 'product'
  description: string
  actor: string
  metadata?: Record<string, unknown>
  status: 'success' | 'failed' | 'pending'
}

export interface MerchantDashboard {
  totalRevenue: number
  aiGeneratedRevenue: number
  totalOrders: number
  conversionRate: number
  averageOrderValue: number
  upsellRevenue: number
  failedPayments: number
  supportHandoffs: number
  topProducts: Product[]
  recentOrders: Order[]
  auditTrail: AuditEvent[]
}

export interface PaymentStatus {
  orderId: string
  status: 'processing' | 'successful' | 'failed'
  amount: number
  timestamp: Date
  transactionId?: string
  errorMessage?: string
  verified?: boolean
  mode?: 'live' | 'demo'
}

export interface User {
  id: string
  name: string
  email: string
  role: 'customer' | 'merchant' | 'admin'
  avatar?: string
}
