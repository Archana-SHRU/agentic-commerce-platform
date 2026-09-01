import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthRole = 'customer' | 'merchant'

export type AuthUser = {
  name: string
  email: string
  role: AuthRole
  icon: string
}

type LoginInput = {
  email: string
  password: string
}

type SignupInput = LoginInput & {
  name: string
  role?: AuthRole
}

type StoredUser = AuthUser & {
  password: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (input: LoginInput) => void
  signup: (input: SignupInput) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USERS_KEY = 'razorcart_ai_demo_users'
const SESSION_KEY = 'razorcart_ai_demo_session'

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

function readStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readSessionEmail(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function writeSessionEmail(email: string | null) {
  if (!email) {
    localStorage.removeItem(SESSION_KEY)
    return
  }

  localStorage.setItem(SESSION_KEY, email)
}

function stripPassword(user: StoredUser): AuthUser {
  const { password: _password, ...profile } = user
  return profile
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const email = readSessionEmail()
    if (!email) return

    const storedUser = readStoredUsers().find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase()
    )

    if (storedUser) {
      setUser(stripPassword(storedUser))
    }
  }, [])

  useEffect(() => {
    writeSessionEmail(user?.email ?? null)
  }, [user])

  const login = ({ email, password }: LoginInput) => {
    const storedUsers = readStoredUsers()
    const matchedUser = storedUsers.find(
      (candidate) =>
        candidate.email.toLowerCase() === email.toLowerCase() &&
        candidate.password === password
    )

    if (!matchedUser) {
      throw new Error('Invalid email or password.')
    }

    setUser(stripPassword(matchedUser))
  }

  const signup = ({ name, email, password, role = 'customer' }: SignupInput) => {
    const storedUsers = readStoredUsers()
    const existingUser = storedUsers.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      throw new Error('An account with that email already exists.')
    }

    const newUser: StoredUser = {
      name,
      email,
      password,
      role,
      icon: getAvatar(name),
    }

    const nextUsers = [...storedUsers, newUser]
    writeStoredUsers(nextUsers)
    setUser(stripPassword(newUser))
  }

  const logout = () => {
    setUser(null)
    writeSessionEmail(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
