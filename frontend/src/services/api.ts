import axios from 'axios'

/**
 * Resolves the backend API base URL with a guaranteed `/api` prefix.
 *
 * Prevents route mismatches (such as hitting `/products` instead of `/api/products`),
 * while safely avoiding duplicate `/api/api` prefixes if `/api` is already included:
 * - Bare host (e.g. `https://example.com` or `https://example.com/`) -> `https://example.com/api`
 * - Host with `/api` (e.g. `https://example.com/api` or `/api/`)   -> `https://example.com/api`
 * - Same-origin relative path (e.g. `/api`)                        -> `/api`
 * - Unset in development                                           -> `http://localhost:8000/api`
 * - Unset in production                                            -> `/api`
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (configured) {
    const clean = configured.replace(/\/+$/, '')
    return clean.endsWith('/api') ? clean : `${clean}/api`
  }

  return import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'
}

export const baseURL = getApiBaseUrl()

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Attach the stored JWT access token to every outgoing request.
 *
 * Read lazily from localStorage per request (rather than captured once at
 * module load) so login/logout takes effect immediately without a reload.
 * Imported inline to avoid a circular import with authService.
 */
api.interceptors.request.use((config) => {
  let token: string | null = null

  try {
    token = localStorage.getItem('razorcart_ai_access_token')
  } catch {
    token = null
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
