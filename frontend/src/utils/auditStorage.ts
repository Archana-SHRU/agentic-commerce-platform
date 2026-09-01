import { AuditEvent } from '../types'
import { mockAuditTrail } from './mockOrders'

const AUDIT_STORAGE_KEY = 'ai_commerce_live_audit_events'

const getLiveEvents = (): AuditEvent[] => {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as AuditEvent[]
    // Dates are serialized as strings in localStorage - revive them
    return parsed.map((e) => ({ ...e, timestamp: new Date(e.timestamp) }))
  } catch {
    return []
  }
}

/** Returns the full audit trail: real merchant/customer actions recorded
 * during this session, merged with the seeded demo history, newest first. */
export const getAuditTrail = (): AuditEvent[] => {
  const combined = [...getLiveEvents(), ...mockAuditTrail]
  return combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export const recordAuditEvent = (
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): AuditEvent => {
  const fullEvent: AuditEvent = {
    ...event,
    id: `evt-live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date(),
  }

  const existing = getLiveEvents()
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([fullEvent, ...existing]))
  window.dispatchEvent(new Event('audit-updated'))

  return fullEvent
}
