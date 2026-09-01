import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, MicOff, Send, Star } from 'lucide-react'
import { ChatMessage, Product } from '../types'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage?: (text: string) => void
  isLoading?: boolean
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

interface MinimalSpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  suggestions,
  onSuggestionClick,
}) => {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const voiceSupported = getSpeechRecognitionConstructor() !== null

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const handleSend = () => {
    if (!input.trim()) return

    onSendMessage?.(input)
    setInput('')
  }

  const toggleVoiceInput = () => {
    const SpeechRecognitionImpl = getSpeechRecognitionConstructor()
    if (!SpeechRecognitionImpl) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setInput(transcript)
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="mb-2 text-2xl font-bold text-slate-900">Welcome!</p>
              <p className="text-slate-600">
                Start by telling me what you&apos;re looking for today.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2.5 lg:max-w-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm">{msg.text}</p>

                {msg.products && msg.products.length > 0 && msg.sender === 'ai' && (
                  <div className="mt-3 space-y-2">
                    {msg.products.slice(0, 4).map((product: Product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 transition-colors hover:border-blue-300"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-900">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-900">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Star size={10} className="fill-yellow-400 text-yellow-400" />
                              {product.rating}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {msg.suggestions && msg.sender === 'ai' && (
                  <div className="mt-3 space-y-2">
                    {msg.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSuggestionClick?.(sug)}
                        className="block w-full rounded-lg bg-blue-50 px-2 py-1 text-left text-xs text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        → {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-900">
              <div className="flex gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {suggestions && suggestions.length > 0 && messages.length === 0 && (
        <div className="border-t border-slate-200 p-4">
          <p className="mb-3 text-xs font-semibold text-slate-600">
            Quick suggestions:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSuggestionClick?.(sug)
                  setInput(sug)
                }}
                className="rounded-xl bg-blue-50 px-3 py-2 text-left text-sm text-blue-700 transition-colors hover:bg-blue-100"
              >
                💡 {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? 'Listening...' : 'Type your message...'}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />

          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              title={isListening ? 'Stop voice input' : 'Speak your request'}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`rounded-xl px-3 py-2 transition-colors ${
                isListening
                  ? 'animate-pulse bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
          >
            <Send size={18} />
          </button>
        </div>

        {!voiceSupported && (
          <p className="mt-3 text-xs text-slate-500">
            Voice input is not supported in this browser.
          </p>
        )}
      </div>
    </div>
  )
}
