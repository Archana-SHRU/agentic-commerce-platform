import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

type RequireAuthProps = {
  children: React.ReactNode
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const location = useLocation()
  const { user, isInitialising } = useAuth()

  if (isInitialising) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Checking your session...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    )
  }

  return <>{children}</>
}

