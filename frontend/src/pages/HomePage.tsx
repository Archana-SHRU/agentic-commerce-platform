import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Scale,
  TrendingUp,
  Zap,
  ShoppingBag,
} from 'lucide-react'
import { ChatInterface } from '../components/ChatInterface'
import { ProductCard } from '../components/ProductCard'
import { ChatMessage, Product } from '../types'
import { getCatalogProducts } from '../utils/catalogStorage'
import { addToCompare } from '../utils/compareStorage'
import { getAIShoppingResponse } from '../services/aiService'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const aiSectionRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() =>
    getCatalogProducts()
  )

  useEffect(() => {
    const handler = () => setCatalogProducts(getCatalogProducts())
    window.addEventListener('catalog-updated', handler)
    return () => window.removeEventListener('catalog-updated', handler)
  }, [])

  const suggestions = useMemo(
    () => [
      'Find me a laptop under ₹60,000',
      'Best headphones for gaming',
      'Show me phones under 30000',
      'Compare MacBook and Dell',
    ],
    []
  )

  const categories = useMemo(() => {
    return Array.from(new Set(catalogProducts.map((product) => product.category))).slice(
      0,
      6
    )
  }, [catalogProducts])

  const trendingProducts = useMemo(() => {
    return [...catalogProducts]
      .sort((a, b) => b.rating - a.rating || a.price - b.price)
      .slice(0, 4)
  }, [catalogProducts])

  const whyCards = useMemo(
    () => [
      {
        icon: Sparkles,
        title: 'AI shopping that understands intent',
        description:
          'Search by budget, category, use case, or comparison request and get catalog-backed answers.',
      },
      {
        icon: Scale,
        title: 'Compare before you buy',
        description:
          'Review ratings, price, features, and merchant details side by side before checkout.',
      },
      {
        icon: CreditCard,
        title: 'Razorpay-powered checkout',
        description:
          'Move from discovery to secure payment in a flow designed for real-world shopping.',
      },
    ],
    []
  )

  const doSearch = (value: string) => {
    const query = value.trim()
    if (!query) return

    navigate('/products', {
      state: { query },
    })
  }

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const result = await getAIShoppingResponse(text)

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: result.notice || result.text,
        timestamp: new Date(),
        products: result.products,
        suggestions:
          result.products.length > 0
            ? ['View all results', 'Compare these']
            : ['Show me laptops', 'Show me phones under 30000', 'Best rated products'],
      }

      setMessages((prev) => [...prev, aiMessage])

      if (result.intent === 'compare' && result.products.length > 0) {
        result.products.slice(0, 2).forEach((product) => {
          addToCompare(product)
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'View all results') {
      const lastUserMessage = [...messages].reverse().find((message) => message.sender === 'user')
      navigate('/products', {
        state: {
          query: lastUserMessage?.text ?? '',
        },
      })
      return
    }

    if (suggestion === 'Compare these') {
      navigate('/compare')
      return
    }

    handleSendMessage(suggestion)
  }

  const scrollToAI = () => {
    aiSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder*="message"]'
      ) as HTMLInputElement | null
      input?.focus()
    }, 700)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#eef2ff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
                <Sparkles size={16} />
                RazorCart AI
              </div>

              <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Shop Smarter with AI.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Discover products, compare smarter, and checkout securely with
                Razorpay.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={scrollToAI}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
                >
                  <Sparkles size={18} />
                  Try AI Assistant
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Browse Products
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Search
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Natural language product discovery
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Compare
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Side-by-side AI recommendations
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Pay
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Secure Razorpay checkout flow
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="rounded-[1.5rem] bg-white text-slate-900 shadow-2xl">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    AI shopping preview
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Ask for products by budget, category, or use case.
                  </p>
                </div>

                <div className="p-4">
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSuggestionClick={handleSuggestionClick}
                    suggestions={suggestions}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Popular categories
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Start from a category or ask in plain English.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/products')}
              className="hidden items-center gap-2 text-sm font-semibold text-blue-600 sm:inline-flex"
            >
              View all products
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => doSearch(category)}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Trending products
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Curated from the live catalog.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
            >
              Browse all
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Why RazorCart AI
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              A product experience built to feel premium.
            </h2>
            <p className="mt-4 text-slate-600">
              The platform blends AI discovery, fast comparison, and a Razorpay-ready
              checkout flow into one clean shopping journey.
            </p>

            <div className="mt-8 space-y-4">
              {whyCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-50">
                <ShieldCheck size={14} />
                Secure checkout
              </div>
              <h3 className="mt-4 text-3xl font-bold">
                Move from discovery to payment with confidence.
              </h3>
              <p className="mt-4 max-w-xl text-blue-100">
                Demo-ready today, backend-ready tomorrow. The payment service is wired
                to Razorpay checkout and can switch to create-order / verify endpoints
                when the backend is available.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:-translate-y-0.5"
                >
                  <CreditCard size={18} />
                  Go to Checkout
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/support')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
                >
                  <ShoppingBag size={18} />
                  Talk to Support
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Live catalog, no fake counts</h3>
                  <p className="text-sm text-slate-600">
                    Everything shown here comes from the current product data.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {['AI recommendations', 'Product comparison', 'Secure checkout', 'Support'].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-300">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="font-semibold">Premium discovery flow</h3>
                  <p className="text-sm text-slate-300">
                    Search, compare, chat, and checkout without leaving the page.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/compare')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  Compare
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  Shop
                </button>
              </div>
            </div>
          </div>
        </section>

        <div ref={aiSectionRef} className="scroll-mt-24" />
      </div>
    </div>
  )
}
