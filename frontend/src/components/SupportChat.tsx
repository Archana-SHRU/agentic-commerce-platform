import { SupportAgent } from '../types'
import { MessageCircle, Phone, Video, Clock, Star } from 'lucide-react'

interface SupportChatProps {
  agent?: SupportAgent
  onConnect?: (type: 'chat' | 'voice' | 'video') => void
  onClose?: () => void
}

export const SupportChat: React.FC<SupportChatProps> = ({
  agent,
  onConnect,
  onClose,
}) => {
  if (!agent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <MessageCircle
          size={48}
          className="text-gray-400 mx-auto mb-4"
        />

        <p className="text-gray-600">
          No expert available at the moment.
        </p>

        <p className="text-sm text-gray-500">
          Please try again in a few moments.
        </p>
      </div>
    )
  }

  const communicationOptions = [
    {
      type: 'chat' as const,
      icon: MessageCircle,
      label: 'Chat',
      description: 'Instant messaging',
      color: 'blue',
    },
    {
      type: 'voice' as const,
      icon: Phone,
      label: 'Voice',
      description: 'Talk directly',
      color: 'purple',
    },
    {
      type: 'video' as const,
      icon: Video,
      label: 'Video',
      description: 'Face-to-face support',
      color: 'green',
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

      {/* Agent Header */}
      <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-4 mb-4">

          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-14 h-14 rounded-full"
          />

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {agent.name}
            </h3>

            <p className="text-sm text-gray-600">
              {agent.specialism}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                agent.status === 'available'
                  ? 'bg-green-500'
                  : 'bg-gray-400'
              }`}
            />

            <span className="text-xs text-gray-600">
              {agent.status === 'available'
                ? 'Available'
                : 'Offline'}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={`${
                i < Math.floor(agent.rating)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              } fill-current`}
            />
          ))}

          <span className="text-xs text-gray-600 ml-2">
            {agent.rating} rating
          </span>
        </div>
      </div>

      {/* Context */}
      <div className="bg-blue-50 border-b border-blue-100 p-4 mx-6 my-4 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">
            About this conversation:
          </span>

          <br />

          Your AI shopping conversation and order context can be shared
          with this expert to help them assist you faster.
        </p>
      </div>

      {/* Preview */}
      <div className="h-40 bg-gray-50 border-t border-b border-gray-200 overflow-y-auto p-4 space-y-2">

        <div className="flex">
          <div className="bg-blue-100 text-blue-900 rounded-lg px-3 py-2 max-w-xs text-sm">
            Hi! How can I help you today?
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-gray-300 text-gray-900 rounded-lg px-3 py-2 max-w-xs text-sm">
            I'd like to know about the product details.
          </div>
        </div>

        <div className="flex">
          <div className="bg-blue-100 text-blue-900 rounded-lg px-3 py-2 max-w-xs text-sm">
            Of course! I'm here to help you.
          </div>
        </div>

      </div>

      {/* Communication Options */}
      <div className="p-6">

        <p className="text-sm font-semibold text-gray-900 mb-4">
          Choose how you want to connect
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {communicationOptions.map(
            ({
              type,
              icon: Icon,
              label,
              description,
            }) => (
              <button
                type="button"
                key={type}
                onClick={() => onConnect?.(type)}
                className="group p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center hover:shadow-md"
              >
                <div className="flex justify-center mb-3">
                  <Icon
                    size={32}
                    className="text-gray-600 group-hover:text-blue-600 transition-colors"
                  />
                </div>

                <p className="font-semibold text-gray-900">
                  {label}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {description}
                </p>
              </button>
            )
          )}

        </div>

        {/* Info */}
        <div className="flex items-start gap-2 text-xs text-gray-600 mt-6 mb-4">
          <Clock size={14} className="mt-0.5" />

          <span>
            Average wait time: 2-3 minutes
          </span>
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Change Agent
        </button>

      </div>
    </div>
  )
}
