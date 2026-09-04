import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Lock, ShieldCheck, Sparkles } from 'lucide-react'

import { extractApiError, resetPassword } from '../services/authService'
import { showToast } from '../utils/toastBus'

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

const MIN_PASSWORD_LENGTH = 8

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Read the token from the URL safely - never trusted, always validated
  // server-side before the password is changed.
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [
    searchParams,
  ])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      await resetPassword({ token, newPassword, confirmPassword })
      setIsDone(true)
      showToast('Password updated. Please sign in.', 'success')
    } catch (err) {
      setError(
        extractApiError(
          err,
          'This password reset link is invalid or has expired. Please request a new one.'
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

          <h1 className="text-3xl font-bold text-slate-900">Reset password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a new password for your account.
          </p>
        </div>

        <div className="space-y-4 px-8 py-7">
          {!token && (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900"
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Missing reset token</p>
                <p className="mt-1">
                  This page needs to be opened from the link in your password
                  reset email.
                </p>
              </div>
            </div>
          )}

          {isDone ? (
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
            >
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={16} />
                Password updated
              </p>
              <p className="mt-1">
                Your password has been changed and this reset link is now used
                up.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-4 w-full rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Go to login
              </button>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock size={14} />
                  New password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  autoComplete="new-password"
                  disabled={!token}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock size={14} />
                  Confirm new password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  disabled={!token}
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
                disabled={isSubmitting || !token}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <ShieldCheck size={18} />
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </button>

              <p className="text-center text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Request a new reset link
                </Link>
              </p>
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

export default ResetPasswordPage
