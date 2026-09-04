import api from './api'

/**
 * Real backend authentication client.
 *
 * Talks to /api/auth/* on the FastAPI backend. No credentials are stored in
 * plaintext and no authentication decision is made in the browser - the token
 * is issued and validated by the backend.
 */

export const TOKEN_STORAGE_KEY = 'razorcart_ai_access_token'

export interface AuthUserResponse {
  id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUserResponse
}

export interface MessageResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string | null) {
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      return
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // Storage can be unavailable (private mode / disabled cookies). The
    // session simply won't survive a reload in that case.
  }
}

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

type ApiErrorShape = {
  response?: {
    status?: number
    data?: {
      detail?: unknown
    }
  }
}

/**
 * Turn an axios/FastAPI error into a single human-readable message.
 *
 * FastAPI returns `detail` as a string for HTTPException and as an array of
 * field errors for 422 validation failures.
 */
export function extractApiError(error: unknown, fallback: string): string {
  const detail = (error as ApiErrorShape)?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg).replace(
            /^Value error,\s*/i,
            ''
          )
        }
        return ''
      })
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join('. ')
    }
  }

  return fallback
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function register(payload: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/register', {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    confirm_password: payload.confirmPassword,
  })

  return response.data
}

export async function login(payload: {
  email: string
  password: string
}): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })

  return response.data
}

export async function fetchCurrentUser(): Promise<AuthUserResponse> {
  const response = await api.get<AuthUserResponse>('/auth/me')
  return response.data
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/forgot-password', {
    email,
  })

  return response.data
}

export async function resetPassword(payload: {
  token: string
  newPassword: string
  confirmPassword: string
}): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/reset-password', {
    token: payload.token,
    new_password: payload.newPassword,
    confirm_password: payload.confirmPassword,
  })

  return response.data
}
