import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { TOAST_EVENT, ToastDetail } from '../utils/toastBus'

const AUTO_DISMISS_MS = 3000

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastDetail[]>([])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail
      setToasts((prev) => [...prev, detail])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id))
      }, AUTO_DISMISS_MS)
    }

    window.addEventListener(TOAST_EVENT, handler)
    return () => window.removeEventListener(TOAST_EVENT, handler)
  }, [])

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={19} className="flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <XCircle size={19} className="flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info size={19} className="flex-shrink-0 mt-0.5" />}

          <p className="text-sm font-medium flex-1">{toast.message}</p>

          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
