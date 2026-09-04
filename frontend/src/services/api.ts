import axios from 'axios'

const configuredBaseURL = import.meta.env.VITE_API_URL?.trim()

// In development, fall back to the local backend for convenience. In a
// production build, fall back to a same-origin relative path instead so a
// missing VITE_API_URL can never point the deployed site at localhost.
const baseURL =
  configuredBaseURL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')

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
