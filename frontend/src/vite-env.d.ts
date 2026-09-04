/// <reference types="vite/client" />

/**
 * Typed frontend environment variables.
 *
 * IMPORTANT: everything here is bundled into the client build and is publicly
 * visible. Only ever add public values.
 *
 * Never add backend secrets such as RAZORPAY_KEY_SECRET, SECRET_KEY,
 * SMTP_PASSWORD or DATABASE_URL to this file or to any VITE_* variable.
 */
interface ImportMetaEnv {
  /** Base URL of the backend API, e.g. http://localhost:8000/api */
  readonly VITE_API_URL?: string

  /** Public Razorpay key id (rzp_test_... / rzp_live_...). Never the secret. */
  readonly VITE_RAZORPAY_KEY_ID?: string

  /** Optional OpenRouter key used by the AI shopping assistant. */
  readonly VITE_OPENROUTER_API_KEY?: string

  /** Optional OpenRouter model override. */
  readonly VITE_OPENROUTER_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
