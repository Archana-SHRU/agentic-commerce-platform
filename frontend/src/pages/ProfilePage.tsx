import { ArrowRight, LogOut, Mail, ShieldCheck, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Account
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Profile</h1>
          <p className="mt-3 text-slate-600">
            Your customer account is backed by the existing RazorCart AI auth system.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                {user?.icon}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Signed in as
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {user?.name}
                </h2>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <Mail size={16} />
                  Email
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {user?.email}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <User size={16} />
                  Account ID
                </div>
                <p className="mt-2 font-mono text-base font-semibold text-slate-900">
                  {user?.id}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={16} />
                  Protected customer account
                </div>
                <p className="mt-2 leading-6">
                  Checkout, order history, and profile access stay behind the login guard.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
                Quick actions
              </p>

              <h2 className="mt-3 text-3xl font-bold">Continue where you left off</h2>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/orders"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  View Orders
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/products"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Shop Products
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Security
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  Real backend authentication
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tokens are issued by the FastAPI auth endpoints and validated on reload.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Session
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  Logged in
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sign out when you are done on a shared device.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

