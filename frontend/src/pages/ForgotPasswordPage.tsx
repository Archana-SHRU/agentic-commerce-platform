import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, Mail, Sparkles } from 'lucide-react'

import { extractApiError, forgotPassword } from '../services/authService'

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccessMessage('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await forgotPassword(email.trim())
      // Only shown when the backend actually accepted and sent the email.
      // If email delivery is not configured, the backend returns an error and
      // we fall into the catch below instead of claiming success.
      setSuccessMessage(result.message)
    } catch (err) {
      setError(
        extractApiError(
          err,
          'Unable to start the password reset right now. Please try again later.'
        )
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
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="space-y-4 px-8 py-7">
          {successMessage ? (
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
            >
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1">{successMessage}</p>
              <p className="mt-2 text-xs text-emerald-700">
                The link expires shortly and can only be used once.
              </p>
            </div>
          ) : (
            <>
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
                <KeyRound size={18} />
                {isSubmitting ? 'Sending link...' : 'Send reset link'}
              </button>
            </>
          )}

          <p className="border-t border-slate-100 pt-4 text-center text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-medium text-blue-600 hover:underline"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
