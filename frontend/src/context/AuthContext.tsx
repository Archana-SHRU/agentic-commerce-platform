import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
  AuthUserResponse,
  extractApiError,
  fetchCurrentUser,
  getStoredToken,
  login as loginRequest,
  register as registerRequest,
  storeToken,
} from '../services/authService'

/**
 * Real, backend-backed authentication state.
 *
 * Credentials are verified by the FastAPI backend; this context only holds
 * the issued JWT and the profile returned alongside it. No password is ever
 * stored in the browser.
 */

export type AuthUser = {
  id: number
  name: string
  email: string
  /** Derived initials used by the header avatar. */
  icon: string
}

type LoginInput = {
  email: string
  password: string
}

type SignupInput = LoginInput & {
  name: string
  confirmPassword: string
}

type AuthContextValue = {
  user: AuthUser | null
  /** True while the stored token is being validated on first load. */
  isInitialising: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  signup: (input: SignupInput) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getAvatar(name: string) {
  const clean = name.trim()
  if (!clean) return 'RC'

  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

  return initials || 'RC'
}

function toAuthUser(user: AuthUserResponse): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    icon: getAvatar(user.name),
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitialising, setIsInitialising] = useState(true)

  // Restore the session from a stored token by asking the backend who it
  // belongs to. An expired or tampered token simply yields no user.
  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      const token = getStoredToken()

      if (!token) {
        if (!cancelled) setIsInitialising(false)
        return
      }

      try {
        const profile = await fetchCurrentUser()
        if (!cancelled) setUser(toAuthUser(profile))
      } catch {
        storeToken(null)
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsInitialising(false)
      }
    }

    void restore()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async ({ email, password }: LoginInput) => {
    try {
      const result = await loginRequest({ email, password })
      storeToken(result.access_token)

      const authUser = toAuthUser(result.user)
      setUser(authUser)
      return authUser
    } catch (error) {
      storeToken(null)
      throw new Error(extractApiError(error, 'Unable to sign in right now.'))
    }
  }, [])

  const signup = useCallback(
    async ({ name, email, password, confirmPassword }: SignupInput) => {
      try {
        const result = await registerRequest({
          name,
          email,
          password,
          confirmPassword,
        })
        storeToken(result.access_token)

        const authUser = toAuthUser(result.user)
        setUser(authUser)
        return authUser
      } catch (error) {
        storeToken(null)
        throw new Error(
          extractApiError(error, 'Unable to create your account right now.')
        )
      }
    },
    []
  )

  const logout = useCallback(() => {
    storeToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isInitialising, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
