import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Sparkles, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type AuthMode = 'signup' | 'login'

type AuthModalProps = {
  open: boolean
  mode: AuthMode
  onClose: () => void
}

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  mode,
  onClose,
}) => {
  const { login, signup } = useAuth()
  const [activeMode, setActiveMode] = useState<AuthMode>(mode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setActiveMode(mode)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }, [open, mode])

  if (!open) return null

  const handleSubmit = async () => {
    setError('')

    const isSignup = activeMode === 'signup'

    if (!email.trim() || !password || (isSignup && !name.trim())) {
      setError(
        isSignup
          ? 'Please fill in your name, email and password.'
          : 'Please fill in your email and password.'
      )
      return
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    try {
      setIsSubmitting(true)

      if (isSignup) {
        await signup({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        })
      } else {
        await login({
          email: email.trim(),
          password,
        })
      }

      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to authenticate right now.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSubmitting) {
      void handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
              <Sparkles size={14} />
              RazorCart AI
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              {activeMode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              {activeMode === 'signup'
                ? 'Save your profile and move faster through checkout.'
                : 'Sign in to pick up your cart and orders.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
            aria-label="Close authentication dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveMode('signup')
                setError('')
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign up
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('login')
                setError('')
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Login
            </button>
          </div>

          <div className="space-y-4">
            {activeMode === 'signup' && (
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
            )}

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
                placeholder={
                  activeMode === 'signup'
                    ? 'At least 8 characters'
                    : 'Enter your password'
                }
                autoComplete={
                  activeMode === 'signup' ? 'new-password' : 'current-password'
                }
                className={inputClass}
              />
            </label>

            {activeMode === 'signup' && (
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
            )}

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
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? 'Please wait...'
                : activeMode === 'signup'
                  ? 'Create account'
                  : 'Login'}
            </button>

            {activeMode === 'login' && (
              <p className="text-center text-sm">
                <Link
                  to="/forgot-password"
                  onClick={onClose}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Forgot your password?
                </Link>
              </p>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Accounts are stored securely on the RazorCart AI backend. Passwords
            are hashed and never stored in your browser.
          </p>

          <p className="mt-2 text-center text-xs text-slate-500">
            Prefer a full page?{' '}
            <Link
              to={activeMode === 'signup' ? '/signup' : '/login'}
              onClick={onClose}
              className="font-medium text-blue-600 hover:underline"
            >
              Open {activeMode === 'signup' ? 'sign up' : 'login'} page
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
