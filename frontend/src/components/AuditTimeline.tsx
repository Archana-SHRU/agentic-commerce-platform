import { AuditEvent } from '../types'
import { Check, Clock, AlertCircle, Search, Zap, ShoppingCart, CreditCard, MessageCircle, Package } from 'lucide-react'

interface AuditTimelineProps {
  events: AuditEvent[]
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'request':
      return <Zap size={16} className="text-blue-600" />
    case 'search':
      return <Search size={16} className="text-purple-600" />
    case 'recommendation':
      return <Zap size={16} className="text-amber-600" />
    case 'approval':
      return <Check size={16} className="text-green-600" />
    case 'order':
      return <ShoppingCart size={16} className="text-indigo-600" />
    case 'payment':
      return <CreditCard size={16} className="text-pink-600" />
    case 'support':
      return <MessageCircle size={16} className="text-cyan-600" />
    case 'product':
      return <Package size={16} className="text-teal-600" />
    default:
      return <Clock size={16} className="text-gray-600" />
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <Check className="text-green-600" size={20} />
    case 'failed':
      return <AlertCircle className="text-red-600" size={20} />
    case 'pending':
      return <Clock className="text-amber-600" size={20} />
    default:
      return null
  }
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline line */}
          {index < events.length - 1 && (
            <div
              className={`absolute left-6 top-12 w-1 h-8 ${
                event.status === 'failed' ? 'bg-red-200' : 'bg-gray-200'
              }`}
            />
          )}

          {/* Event */}
          <div className="flex gap-4">
            {/* Icon circle */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mt-1 ${
                event.status === 'success'
                  ? 'bg-green-100'
                  : event.status === 'failed'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
              }`}
            >
              {getEventIcon(event.type)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{event.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.timestamp.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex-shrink-0">{getStatusIcon(event.status)}</div>
              </div>

              {event.metadata && (
                <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 mt-2 inline-block">
                  {Object.entries(event.metadata)
                    .slice(0, 2)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
