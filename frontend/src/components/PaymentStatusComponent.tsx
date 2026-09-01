import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Clock, RefreshCw, ShieldCheck } from 'lucide-react'
import { PaymentStatus } from '../types'

interface PaymentStatusComponentProps {
  status: PaymentStatus
  onRetry?: () => void
}

export const PaymentStatusComponent: React.FC<PaymentStatusComponentProps> = ({
  status,
  onRetry,
}) => {
  const isSuccessful = status.status === 'successful'
  const isFailed = status.status === 'failed'
  const isProcessing = status.status === 'processing'
  const isVerified = Boolean(status.verified)
  const isDemo = status.mode === 'demo' || !isVerified

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl">
      <div
        className={`px-8 py-10 text-center ${
          isSuccessful
            ? 'bg-gradient-to-br from-emerald-50 to-white'
            : isFailed
              ? 'bg-gradient-to-br from-rose-50 to-white'
              : 'bg-gradient-to-br from-amber-50 to-white'
        }`}
      >
        <div className="mb-6 flex justify-center">
          {isSuccessful && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={32} />
            </div>
          )}

          {isFailed && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle size={32} />
            </div>
          )}

          {isProcessing && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock size={32} className="animate-spin" />
            </div>
          )}
        </div>

        <p
          className={`mb-2 text-sm font-semibold tracking-[0.2em] ${
            isSuccessful
              ? 'text-emerald-600'
              : isFailed
                ? 'text-rose-600'
                : 'text-amber-600'
          }`}
        >
          {isSuccessful && 'PAYMENT SUCCESSFUL'}
          {isFailed && 'PAYMENT FAILED'}
          {isProcessing && 'PROCESSING PAYMENT'}
        </p>

        <h2 className="text-3xl font-bold text-slate-900">
          {isSuccessful && 'Payment Successful 🎉'}
          {isFailed && 'Payment Failed'}
          {isProcessing && 'Processing your payment'}
        </h2>

        <p className="mt-4 text-lg font-semibold text-slate-900">
          ₹{status.amount.toLocaleString('en-IN')}
        </p>

        <div className="mx-auto mt-6 max-w-md text-sm leading-6 text-slate-600">
          {isSuccessful && (
            <>
              <p>
                {isVerified
                  ? 'Your payment has been verified successfully.'
                  : 'This is a demo checkout result. The payment flow ran in demo mode because backend verification was unavailable.'}
              </p>
              {status.transactionId && (
                <p className="mt-2 text-xs text-slate-500">
                  Transaction ID: {status.transactionId}
                </p>
              )}
            </>
          )}

          {isFailed && (
            <>
              <p>{status.errorMessage || 'The payment could not be completed.'}</p>
              <p className="mt-2 text-xs text-slate-500">
                Please try again or contact support.
              </p>
            </>
          )}

          {isProcessing && (
            <p>Razorpay is processing your payment. Please do not refresh the page.</p>
          )}
        </div>

        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Order ID
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
            {status.orderId}
          </p>

          {isSuccessful && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <ShieldCheck size={14} />
              {isVerified ? 'Verified by backend' : 'Demo verification'}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {isSuccessful && (
            <>
              <Link
                to="/products"
                className="block w-full rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Continue Shopping
              </Link>
              <Link
                to="/"
                className="block w-full rounded-2xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Back to Home
              </Link>
            </>
          )}

          {isFailed && (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <RefreshCw size={18} />
                Retry Payment
              </button>
              <Link
                to="/cart"
                className="block w-full rounded-2xl bg-slate-100 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Back to Cart
              </Link>
            </>
          )}

          {isProcessing && (
            <p className="text-sm text-slate-500">This usually takes 1-2 minutes.</p>
          )}
        </div>
      </div>
    </div>
  )
}
