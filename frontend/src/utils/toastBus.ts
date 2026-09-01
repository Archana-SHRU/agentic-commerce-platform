export type ToastType = 'success' | 'error' | 'info'

export interface ToastDetail {
  id: string
  message: string
  type: ToastType
}

export const TOAST_EVENT = 'app-toast'

export const showToast = (message: string, type: ToastType = 'success') => {
  const detail: ToastDetail = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
  }

  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail }))
}
