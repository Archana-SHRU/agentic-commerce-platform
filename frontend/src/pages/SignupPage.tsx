import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, Sparkles, User, UserPlus } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { showToast } from '../utils/toastBus'

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

const MIN_PASSWORD_LENGTH = 8

type LocationState = {
  from?: string
}

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = (location.state as LocationState | null)?.from || '/'

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.'
    if (!email.trim()) return 'Please enter your email.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Please enter a valid email address.'
    if (password.length < MIN_PASSWORD_LENGTH)
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    if (password !== confirmPassword) return 'Passwords do not match.'
    return ''
  }

  const handleSubmit = async () => {
    const validationError = validate()
    setError(validationError)
    if (validationError) return

    try {
      setIsSubmitting(true)
      const user = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      })
      showToast(`Account created. Welcome, ${user.name}!`, 'success')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create your account.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSubmitting) void handleSubmit()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
            <Sparkles size={14} />
            RazorCart AI
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Save your profile and move faster through checkout.
          </p>
        </div>

        <div className="space-y-4 px-8 py-7">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <User size={14} />
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your name"
              autoComplete="name"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail size={14} />
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Lock size={14} />
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Lock size={14} />
              Confirm password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={inputClass}
            />
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserPlus size={18} />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from: redirectTo }}
              className="font-semibold text-blue-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
