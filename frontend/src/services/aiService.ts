import { Product } from '../types'
import { getCatalogProducts } from '../utils/catalogStorage'
import { getAIRecommendation, AIQueryResult } from '../utils/aiEngine'

export type AIShoppingResponse = AIQueryResult & {
  source: 'openrouter' | 'fallback'
  notice?: string
}

type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

function getApiKey() {
  return import.meta.env.VITE_OPENROUTER_API_KEY?.trim() || ''
}

function getModel() {
  return import.meta.env.VITE_OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'
}

function buildCatalogContext(products: Product[]) {
  return products
    .slice(0, 12)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      rating: product.rating,
      availability: product.availability,
      merchant: product.merchant.name,
      features: product.features,
      description: product.description,
    }))
}

function selectRelevantProducts(query: string, products: Product[]) {
  const local = getAIRecommendation(query)
  if (local.products.length > 0) {
    return local.products.slice(0, 6)
  }

  const lower = query.toLowerCase()
  return products
    .filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.description,
        product.merchant.name,
        ...product.features,
      ]
        .join(' ')
        .toLowerCase()

      return (
        !lower.trim() ||
        haystack.includes(lower) ||
        lower.includes(product.category.toLowerCase())
      )
    })
    .slice(0, 6)
}

async function callOpenRouter(
  messages: OpenRouterMessage[]
): Promise<string | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-OpenRouter-Title': 'RazorCart AI',
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}`)
  }

  const data = (await response.json()) as OpenRouterResponse
  return data.choices?.[0]?.message?.content?.trim() || null
}

function parseStructuredResponse(
  content: string | null,
  fallback: AIQueryResult
): AIQueryResult {
  if (!content) return fallback

  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as {
      text?: string
      intent?: AIQueryResult['intent']
      productIds?: string[]
    }

    const catalog = getCatalogProducts()
    const products = (parsed.productIds || [])
      .map((id) => catalog.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product))

    return {
      text: parsed.text || fallback.text,
      intent: parsed.intent || fallback.intent,
      products: products.length > 0 ? products : fallback.products,
    }
  } catch {
    return fallback
  }
}

export async function getAIShoppingResponse(
  query: string
): Promise<AIShoppingResponse> {
  const localFallback = getAIRecommendation(query)
  const catalog = getCatalogProducts()
  const relevantProducts = selectRelevantProducts(query, catalog)

  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      ...localFallback,
      products: relevantProducts.length > 0 ? relevantProducts : localFallback.products,
      source: 'fallback',
      notice: 'AI service is not configured yet. Please add your API key.',
    }
  }

  const systemPrompt = [
    'You are RazorCart AI, a premium e-commerce shopping assistant.',
    'Use only the provided catalog context.',
    'Return compact JSON with keys: text, intent, productIds.',
    'Intent must be one of: category, compare, best-rated, search, none.',
    'Use productIds from the supplied catalog when recommending items.',
    'If the user asks to compare products, choose up to two matching product ids.',
  ].join(' ')

  const catalogContext = JSON.stringify(buildCatalogContext(relevantProducts), null, 2)

  try {
    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `Customer request: ${query}`,
          `Relevant catalog context: ${catalogContext}`,
          'Reply with JSON only.',
        ].join('\n\n'),
      },
    ])

    const parsed = parseStructuredResponse(content, {
      ...localFallback,
      products: relevantProducts.length > 0 ? relevantProducts : localFallback.products,
    })

    return {
      ...parsed,
      source: 'openrouter',
    }
  } catch {
    return {
      ...localFallback,
      products: relevantProducts.length > 0 ? relevantProducts : localFallback.products,
      source: 'fallback',
      notice: 'AI service is not configured yet. Please add your API key.',
    }
  }
}
