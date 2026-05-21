import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserChats, getDailyCount, countUserChats } from '@/lib/chat'
import { formatRelativeDate, truncate } from '@/lib/utils'
import type { Plan } from '@/types'

export const metadata: Metadata = {
  title: 'Chat IA — FitPrompt',
}

const FREE_DAILY_LIMIT = 5
const FREE_CHAT_LIMIT = 3

interface PageProps {
  searchParams: Promise<{ limitReached?: string }>
}

export default async function ChatListPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null  // unreachable — DashboardLayout guards first

  const userId = session.user.id
  const plan = (session.user as { plan?: Plan }).plan ?? 'free'
  const { limitReached } = await searchParams

  const [chats, messagesUsedToday, chatCount] = await Promise.all([
    getUserChats(userId),
    getDailyCount(userId),
    countUserChats(userId),
  ])

  const isFree = plan === 'free'
  const atChatLimit = isFree && chatCount >= FREE_CHAT_LIMIT
  const messagesLeft = Math.max(0, FREE_DAILY_LIMIT - messagesUsedToday)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── DESKTOP EMPTY STATE ───────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 bg-[#FF471A0F] border border-[#FF471A22] rounded-3xl flex items-center justify-center mb-6">
          <span className="text-4xl">🤖</span>
        </div>
        <h1 className="text-text-primary font-black text-2xl mb-2 tracking-tight">
          FitCoach IA
        </h1>
        <p className="text-text-muted text-sm mb-8 max-w-xs leading-relaxed">
          Selecciona un chat del panel o crea uno nuevo para empezar.
        </p>

        {isFree && (
          <div className="bg-bg-secondary border border-border-default rounded-2xl px-6 py-4 mb-6 w-full max-w-xs">
            <p className="text-text-secondary text-xs font-medium mb-2">Mensajes hoy</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF471A] rounded-full transition-all duration-700"
                  style={{ width: `${(messagesUsedToday / FREE_DAILY_LIMIT) * 100}%` }}
                />
              </div>
              <span className="text-text-primary text-xs font-bold tabular-nums shrink-0">
                {messagesUsedToday}/{FREE_DAILY_LIMIT}
              </span>
            </div>
            {messagesLeft === 0 && (
              <p className="text-[#FF471A] text-[10px] mt-1.5 font-medium">
                Límite diario alcanzado — renueva a las 00:00 UTC
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs">
          {atChatLimit ? (
            <Link
              href="/settings"
              className="flex items-center justify-center gap-2 bg-bg-secondary border border-border-default text-text-muted px-5 py-3 rounded-xl text-sm font-bold transition-all"
            >
              Hazte Premium para más chats
            </Link>
          ) : (
            <Link
              href="/chat/new"
              className="flex items-center justify-center gap-2 bg-[#FF471A] hover:bg-[#e03d15] active:scale-[0.97] text-white px-5 py-3 rounded-xl text-sm font-bold transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Nuevo chat
            </Link>
          )}
        </div>
      </div>

      {/* ── MOBILE FULL LIST ──────────────────────────────────── */}
      <div className="md:hidden flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full animate-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-text-primary">Chat IA</h1>
            <p className="text-text-secondary text-sm mt-1">Tu entrenador personal siempre disponible</p>
          </div>
          {atChatLimit ? (
            <Link
              href="/settings"
              className="bg-bg-tertiary border border-border-default text-text-muted px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-not-allowed"
              title="Límite de chats alcanzado — hazte Premium"
            >
              <span>+</span> Nuevo chat
            </Link>
          ) : (
            <Link
              href="/chat/new"
              className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-[0.97] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <span>+</span> Nuevo chat
            </Link>
          )}
        </div>

        {/* Chat limit reached banner */}
        {limitReached && atChatLimit && (
          <div className="bg-[#FF471A1A] border border-[#FF471A33] rounded-2xl p-4 mb-5 flex items-start gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-[#FF471A] font-semibold text-sm">Límite de chats alcanzado</p>
              <p className="text-text-secondary text-xs mt-0.5">
                El plan Free permite hasta {FREE_CHAT_LIMIT} chats.{' '}
                <Link href="/settings" className="underline underline-offset-2 hover:text-[#FF471A]">
                  Hazte Premium
                </Link>{' '}
                para chats ilimitados.
              </p>
            </div>
          </div>
        )}

        {/* Daily counter */}
        {isFree && (
          <div className="bg-bg-secondary border border-border-default rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-sm font-medium mb-2">Mensajes usados hoy</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-40 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF471A] rounded-full transition-all duration-700"
                    style={{ width: `${(messagesUsedToday / FREE_DAILY_LIMIT) * 100}%` }}
                  />
                </div>
                <span className="text-text-primary text-sm font-bold shrink-0">
                  {messagesUsedToday} / {FREE_DAILY_LIMIT}
                </span>
              </div>
              {messagesLeft === 0 && (
                <p className="text-[#FF471A] text-xs mt-1.5 font-medium">
                  Límite diario alcanzado — se renueva a las 00:00 UTC
                </p>
              )}
            </div>
            <Link
              href="/settings"
              className="shrink-0 bg-[#FF471A1A] hover:bg-[#FF471A33] border border-[#FF471A33] text-[#FF471A] text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Premium
            </Link>
          </div>
        )}

        {/* Chat list */}
        {chats.length > 0 ? (
          <div className="space-y-3">
            {chats.map((chat, i) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-start gap-4 bg-bg-secondary border border-border-default hover:border-[#FF471A44] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] rounded-2xl p-4 transition-all duration-200 group animate-enter"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-10 h-10 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-[#FF471A] text-base">💬</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-text-primary font-semibold text-sm truncate group-hover:text-[#FF471A] transition-colors">
                      {chat.title}
                    </p>
                    <span className="text-text-muted text-xs shrink-0">
                      {formatRelativeDate(chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs truncate">
                    {chat.lastMessage ? truncate(chat.lastMessage, 80) : 'Sin mensajes aún'}
                  </p>
                  {chat.messageCount > 0 && (
                    <p className="text-text-subtle text-[10px] mt-1">
                      {chat.messageCount} mensaje{chat.messageCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-text-primary font-bold text-lg mb-2">Aún no tienes chats</h2>
            <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
              Crea tu primera conversación con FitCoach y empieza a entrenar con IA.
            </p>
            <Link
              href="/chat/new"
              className="inline-flex items-center gap-2 bg-[#FF471A] hover:bg-[#e03d15] active:scale-[0.97] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all"
            >
              <span>+</span> Crear primer chat
            </Link>
          </div>
        )}

        {isFree && chats.length > 0 && (
          <p className="text-center text-text-muted text-xs mt-6">
            Plan Free: {chatCount} / {FREE_CHAT_LIMIT} chats.{' '}
            <Link href="/settings" className="text-[#FF471A] hover:underline">
              Hazte Premium
            </Link>{' '}
            para chats ilimitados.
          </p>
        )}
      </div>
    </div>
  )
}
