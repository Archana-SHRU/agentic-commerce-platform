import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Clock,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Search,
  Send,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react'

import AuthModal from '../components/AuthModal'
import { SupportChat } from '../components/SupportChat'
import { useAuth } from '../context/AuthContext'
import { getAvailableAgents } from '../utils/mockSupport'

interface SessionMessage {
  id: string
  sender: 'me' | 'agent'
  text: string
}

type SupportChannel = 'chat' | 'voice' | 'video'

const CHANNEL_META: Record<
  SupportChannel,
  {
    label: string
    description: string
    icon: typeof MessageCircle
    gradient: string
  }
> = {
  chat: {
    label: 'Chat',
    description: 'Real-time support conversation',
    icon: MessageCircle,
    gradient: 'from-blue-600 to-indigo-700',
  },

  voice: {
    label: 'Voice',
    description: 'Voice support experience',
    icon: Phone,
    gradient: 'from-purple-600 to-indigo-700',
  },

  video: {
    label: 'Video',
    description: 'Video support experience',
    icon: Video,
    gradient: 'from-emerald-600 to-teal-700',
  },
}

const SUPPORT_CARD_STYLES: Record<
  'blue' | 'purple' | 'emerald',
  {
    badge: string
    text: string
  }
> = {
  blue: {
    badge: 'bg-blue-50',
    text: 'text-blue-600',
  },

  purple: {
    badge: 'bg-purple-50',
    text: 'text-purple-600',
  },

  emerald: {
    badge: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
}

export const SupportPage: React.FC = () => {
  const agents = getAvailableAgents()

  const { user, logout } = useAuth()

  const [selectedAgent, setSelectedAgent] = useState(agents[0])

  const [showExpertPanel, setShowExpertPanel] = useState(false)

  const [connectType, setConnectType] =
    useState<SupportChannel | null>(null)

  const [query, setQuery] = useState('')

  const [showAuthModal, setShowAuthModal] = useState(false)

  const [authMode, setAuthMode] =
    useState<'signup' | 'login'>('signup')

  const [sessionMessages, setSessionMessages] =
    useState<SessionMessage[]>([])

  const [sessionInput, setSessionInput] = useState('')

  const [sessionSeconds, setSessionSeconds] = useState(0)

  const [isMuted, setIsMuted] = useState(false)

  const [isSpeakerOn, setIsSpeakerOn] = useState(true)

  const [isCameraOn, setIsCameraOn] = useState(true)

  useEffect(() => {
    if (!connectType) {
      setSessionSeconds(0)
      return
    }

    setSessionSeconds(0)

    const interval = window.setInterval(() => {
      setSessionSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [connectType])

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  const availableAgents = useMemo(() => {
    const lowerQuery = query.toLowerCase()

    return agents.filter((agent) => {
      return (
        agent.name.toLowerCase().includes(lowerQuery) ||
        (agent.specialism || '')
          .toLowerCase()
          .includes(lowerQuery)
      )
    })
  }, [agents, query])

  const supportPriority: Record<
    SupportChannel,
    string[]
  > = {
    chat: ['general', 'support', 'care'],

    voice: ['technical', 'electronics', 'support'],

    video: ['fashion', 'lifestyle', 'support'],
  }

  const selectSupportAgent = (
    type: SupportChannel
  ) => {
    const pool =
      availableAgents.length > 0
        ? availableAgents
        : agents

    const rankedPool = [...pool].sort(
      (a, b) => b.rating - a.rating
    )

    const keywords = supportPriority[type]

    return (
      rankedPool.find((agent) =>
        keywords.some((keyword) =>
          (agent.specialism || '')
            .toLowerCase()
            .includes(keyword)
        )
      ) ?? rankedPool[0]
    )
  }

  const activeAgent =
    selectedAgent ??
    selectSupportAgent(connectType ?? 'chat')

  const endSession = () => {
    setConnectType(null)

    setSessionMessages([])

    setSessionInput('')

    setSessionSeconds(0)

    setIsMuted(false)

    setIsSpeakerOn(true)

    setIsCameraOn(true)
  }

  const handleQuickConnect = (
    type: SupportChannel
  ) => {
    const nextAgent = selectSupportAgent(type)

    setSelectedAgent(nextAgent)

    setConnectType(type)

    setShowExpertPanel(false)
  }

  const handleSendSessionMessage = () => {
    if (!sessionInput.trim()) return

    const myMessage: SessionMessage = {
      id: `sm-${Date.now()}`,
      sender: 'me',
      text: sessionInput.trim(),
    }

    setSessionMessages((prev) => [
      ...prev,
      myMessage,
    ])

    setSessionInput('')

    window.setTimeout(() => {
      setSessionMessages((prev) => [
        ...prev,
        {
          id: `sm-${Date.now() + 1}`,
          sender: 'agent',
          text: `Thanks for your message! ${
            activeAgent?.name ?? 'Our agent'
          } will help you shortly.`,
        },
      ])
    }, 900)
  }

  // =====================================
  // ACTIVE SESSION SCREEN
  // =====================================

  if (connectType) {
    const meta = CHANNEL_META[connectType]

    const ChannelIcon = meta.icon

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">

            {/* HEADER */}

            <div
              className={`bg-gradient-to-r ${meta.gradient} px-6 py-6 text-white sm:px-8`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-900">
                    <ChannelIcon size={32} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                      Support Experience
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">

                      {meta.label} with{' '}

                      {activeAgent?.name ??
                        'Our Agent'}

                    </h2>

                    <p className="mt-1 text-sm text-white/80">

                      {meta.description}

                    </p>

                  </div>

                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">

                  <div className="flex items-center gap-2 text-sm font-semibold">

                    <Clock size={16} />

                    Session Timer

                  </div>

                  <div className="mt-1 text-2xl font-bold">

                    {formatDuration(sessionSeconds)}

                  </div>

                </div>

              </div>
            </div>

            {/* CONTENT */}

            <div className="p-6 sm:p-8">

              {/* ================= CHAT ================= */}

              {connectType === 'chat' && (

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">

                    <div className="mb-4 flex items-center justify-between">

                      <div>

                        <p className="text-sm font-semibold text-blue-600">
                          LIVE CHAT
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-slate-900">

                          Conversation with{' '}

                          {activeAgent?.name ??
                            'our agent'}

                        </h3>

                      </div>

                      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        Connected

                      </div>

                    </div>

                    {/* CHAT MESSAGES */}

                    <div className="max-h-[26rem] min-h-[20rem] space-y-3 overflow-y-auto rounded-[1.25rem] bg-white p-4 shadow-sm">

                      {sessionMessages.length > 0 ? (

                        sessionMessages.map((msg) => (

                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender === 'me'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >

                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                msg.sender === 'me'
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-slate-200 bg-white text-slate-900'
                              }`}
                            >

                              {msg.text}

                            </div>

                          </div>

                        ))

                      ) : (

                        <div className="flex h-60 items-center justify-center text-center">

                          <div>

                            <MessageCircle
                              size={42}
                              className="mx-auto mb-3 text-blue-500"
                            />

                            <p className="text-lg font-semibold text-slate-900">

                              Start the conversation

                            </p>

                            <p className="mt-2 text-sm text-slate-500">

                              Send a message to connect with{' '}

                              {activeAgent?.name}

                            </p>

                          </div>

                        </div>

                      )}

                    </div>

                    {/* INPUT */}

                    <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">

                      <div className="flex gap-2">

                        <input
                          type="text"
                          value={sessionInput}
                          onChange={(e) =>
                            setSessionInput(
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter'
                            ) {
                              handleSendSessionMessage()
                            }
                          }}
                          placeholder="Type your message..."
                          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <button
                          type="button"
                          onClick={
                            handleSendSessionMessage
                          }
                          disabled={
                            !sessionInput.trim()
                          }
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >

                          <Send size={16} />

                          Send

                        </button>

                      </div>

                    </div>

                  </div>

                  {/* AGENT PROFILE */}

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="rounded-[1.25rem] bg-slate-950 p-5 text-white">

                      <div className="flex items-center gap-4">

                        <img
                          src={activeAgent?.avatar}
                          alt={activeAgent?.name}
                          className="h-16 w-16 rounded-full ring-4 ring-white/10"
                        />

                        <div>

                          <p className="text-sm text-white/70">

                            Agent Profile

                          </p>

                          <h3 className="text-2xl font-bold">

                            {activeAgent?.name}

                          </h3>

                          <p className="text-sm text-white/70">

                            {activeAgent?.specialism}

                          </p>

                        </div>

                      </div>

                      <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-white/80">

                        Your support conversation is
                        active. Send your question to
                        get started.

                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* ================= VOICE ================= */}

              {connectType === 'voice' && (

                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

                  <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">

                    <div className="flex justify-between">

                      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">

                        <Phone size={14} />

                        VOICE CALL

                      </div>

                      <div className="flex items-center gap-2 text-xs text-emerald-300">

                        <span className="h-2 w-2 rounded-full bg-emerald-400" />

                        Connected

                      </div>

                    </div>

                    <div className="mt-10 flex flex-col items-center text-center">

                      <img
                        src={activeAgent?.avatar}
                        alt={activeAgent?.name}
                        className="h-32 w-32 rounded-full ring-8 ring-white/10"
                      />

                      <h3 className="mt-5 text-3xl font-bold">

                        {activeAgent?.name}

                      </h3>

                      <p className="mt-2 text-white/70">

                        {activeAgent?.specialism}

                      </p>

                      <div className="mt-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">

                        <Clock size={16} />

                        {formatDuration(
                          sessionSeconds
                        )}

                      </div>

                    </div>

                  </div>

                  {/* VOICE CONTROLS */}

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">

                    <h3 className="text-xl font-bold text-slate-900">

                      Call Controls

                    </h3>

                    <div className="mt-6 grid grid-cols-3 gap-3">

                      {/* MUTE */}

                      <button
                        type="button"
                        onClick={() =>
                          setIsMuted(
                            (value) => !value
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 hover:bg-slate-100"
                      >

                        <div className="flex justify-center">

                          {isMuted ? (

                            <MicOff size={20} />

                          ) : (

                            <Mic size={20} />

                          )}

                        </div>

                        <p className="mt-2 text-sm">

                          {isMuted
                            ? 'Unmute'
                            : 'Mute'}

                        </p>

                      </button>

                      {/* SPEAKER */}

                      <button
                        type="button"
                        onClick={() =>
                          setIsSpeakerOn(
                            (value) => !value
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 hover:bg-slate-100"
                      >

                        <div className="flex justify-center">

                          {isSpeakerOn ? (

                            <Volume2 size={20} />

                          ) : (

                            <VolumeX size={20} />

                          )}

                        </div>

                        <p className="mt-2 text-sm">

                          Speaker

                        </p>

                      </button>

                      {/* END */}

                      <button
                        type="button"
                        onClick={endSession}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 hover:bg-red-100"
                      >

                        <div className="flex justify-center">

                          <PhoneOff size={20} />

                        </div>

                        <p className="mt-2 text-sm">

                          End Call

                        </p>

                      </button>

                    </div>

                  </div>

                </div>

              )}

              {/* ================= VIDEO ================= */}

              {connectType === 'video' && (

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                  <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">

                    <div className="flex justify-between">

                      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">

                        <Video size={14} />

                        VIDEO CALL

                      </div>

                      <div className="text-emerald-300 text-xs">

                        ● Connected

                      </div>

                    </div>

                    <div className="mt-6 flex min-h-[22rem] items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-black text-center">

                      <div>

                        <img
                          src={activeAgent?.avatar}
                          alt={activeAgent?.name}
                          className="mx-auto h-28 w-28 rounded-full ring-8 ring-white/10"
                        />

                        <h3 className="mt-5 text-3xl font-bold">

                          {activeAgent?.name}

                        </h3>

                        <p className="mt-2 text-white/70">

                          {activeAgent?.specialism}

                        </p>

                        <div className="mt-5">

                          {formatDuration(
                            sessionSeconds
                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* VIDEO CONTROLS */}

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">

                    <h3 className="text-xl font-bold text-slate-900">

                      Video Controls

                    </h3>

                    <div className="mt-6 grid grid-cols-2 gap-3">

                      {/* CAMERA */}

                      <button
                        type="button"
                        onClick={() =>
                          setIsCameraOn(
                            (value) => !value
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                      >

                        <div className="flex justify-center">

                          {isCameraOn ? (

                            <Video size={20} />

                          ) : (

                            <VideoOff size={20} />

                          )}

                        </div>

                        <p className="mt-2 text-sm">

                          {isCameraOn
                            ? 'Camera On'
                            : 'Camera Off'}

                        </p>

                      </button>

                      {/* MIC */}

                      <button
                        type="button"
                        onClick={() =>
                          setIsMuted(
                            (value) => !value
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                      >

                        <div className="flex justify-center">

                          {isMuted ? (

                            <MicOff size={20} />

                          ) : (

                            <Mic size={20} />

                          )}

                        </div>

                        <p className="mt-2 text-sm">

                          {isMuted
                            ? 'Unmute'
                            : 'Mute'}

                        </p>

                      </button>

                      {/* SPEAKER */}

                      <button
                        type="button"
                        onClick={() =>
                          setIsSpeakerOn(
                            (value) => !value
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                      >

                        <div className="flex justify-center">

                          {isSpeakerOn ? (

                            <Volume2 size={20} />

                          ) : (

                            <VolumeX size={20} />

                          )}

                        </div>

                        <p className="mt-2 text-sm">

                          Speaker

                        </p>

                      </button>

                      {/* END */}

                      <button
                        type="button"
                        onClick={endSession}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700"
                      >

                        <div className="flex justify-center">

                          <PhoneOff size={20} />

                        </div>

                        <p className="mt-2 text-sm">

                          End

                        </p>

                      </button>

                    </div>

                  </div>

                </div>

              )}

            </div>

            {/* END SESSION */}

            <div className="border-t border-slate-200 px-6 py-5">

              <button
                type="button"
                onClick={endSession}
                className="w-full rounded-2xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-200"
              >

                End Session

              </button>

            </div>

          </div>

        </div>
      </div>
    )
  }

  // =====================================
  // MAIN SUPPORT PAGE
  // =====================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">

              Support

            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">

              Talk to a Brand Expert

            </h1>

            <p className="mt-2 text-sm text-slate-600">

              Choose an expert or start support directly.

            </p>

          </div>

          {user ? (

            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">

                {user.icon}

              </div>

              <div className="text-sm font-medium">

                {user.name}

              </div>

              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-red-600 hover:underline"
              >

                Logout

              </button>

            </div>

          ) : (

            <button
              type="button"
              onClick={() => {
                setAuthMode('signup')
                setShowAuthModal(true)
              }}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >

              Sign up / Login

            </button>

          )}

        </div>

        {/* EXPERT PANEL */}

        {showExpertPanel ? (

          <div className="mx-auto max-w-3xl">

            <SupportChat
              agent={activeAgent}
              onConnect={(type) =>
                setConnectType(type)
              }
              onClose={() =>
                setShowExpertPanel(false)
              }
            />

          </div>

        ) : (

          <>

            {/* SEARCH */}

            <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center gap-2">

                  <Search
                    size={18}
                    className="text-slate-400"
                  />

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Search agents by name or specialism..."
                    className="w-full border-none outline-none"
                  />

                </div>

              </div>

              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-white p-3 text-emerald-600">

                    <Check size={20} />

                  </div>

                  <div>

                    <p className="font-semibold text-emerald-700">

                      AI Indexing

                    </p>

                    <p className="text-sm text-emerald-900">

                      Your catalog is searchable by AI.

                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* AGENTS */}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {availableAgents.map((agent) => (

                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgent(agent)
                    setShowExpertPanel(true)
                  }}
                  className="group text-left"
                >

                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">

                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="h-24 w-24 rounded-full ring-4 ring-white/30"
                      />

                    </div>

                    <div className="space-y-3 p-5">

                      <div className="flex items-center justify-between">

                        <h3 className="text-lg font-bold text-slate-900">

                          {agent.name}

                        </h3>

                        <span className="text-xs font-semibold text-slate-500">

                          {agent.rating}★

                        </span>

                      </div>

                      <p className="text-sm text-slate-600">

                        {agent.specialism}

                      </p>

                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        Available

                      </div>

                    </div>

                  </div>

                </button>

              ))}

            </div>

            {/* SUPPORT CARDS */}

            <div className="mt-12 grid gap-6 md:grid-cols-3">

              {([
                {
                  type: 'chat' as SupportChannel,
                  icon: MessageCircle,
                  title: 'Chat Support',
                  description:
                    'Open a live chat with a support expert.',
                  accent: 'blue' as const,
                },

                {
                  type: 'voice' as SupportChannel,
                  icon: Phone,
                  title: 'Voice Support',
                  description:
                    'Start a professional voice support experience.',
                  accent: 'purple' as const,
                },

                {
                  type: 'video' as SupportChannel,
                  icon: Video,
                  title: 'Video Support',
                  description:
                    'Start a premium video support experience.',
                  accent: 'emerald' as const,
                },

              ]).map(
                ({
                  type,
                  icon: Icon,
                  title,
                  description,
                  accent,
                }) => {

                  const styles =
                    SUPPORT_CARD_STYLES[accent]

                  return (

                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        handleQuickConnect(type)
                      }
                      className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >

                      <div
                        className={`mb-4 inline-flex rounded-2xl p-3 ${styles.badge} ${styles.text}`}
                      >

                        <Icon size={28} />

                      </div>

                      <h3 className="text-xl font-bold text-slate-900">

                        {title}

                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">

                        {description}

                      </p>

                      <p
                        className={`mt-5 text-sm font-semibold ${styles.text}`}
                      >

                        Click to start →

                      </p>

                    </button>

                  )
                }
              )}

            </div>

            {/* BOTTOM INFO */}

            <div className="mt-10 rounded-[1.5rem] border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center">

              <p className="text-sm text-slate-700">

                <strong>
                  Support Experience:
                </strong>{' '}

                Chat is interactive, while voice and
                video provide a realistic support UI.

              </p>

            </div>

          </>

        )}

        {/* AUTH MODAL */}

        <AuthModal
          open={showAuthModal}
          mode={authMode}
          onClose={() =>
            setShowAuthModal(false)
          }
        />

      </div>

    </div>
  )
}