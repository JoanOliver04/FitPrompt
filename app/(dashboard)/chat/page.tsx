import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chat IA',
}

const mockChats = [
  { id: '1', title: 'Mi plan de volumen — semana 1', date: 'Hoy', preview: 'Aquí tienes tu rutina de pecho y tríceps...' },
  { id: '2', title: 'Plan de dieta semanal', date: 'Ayer', preview: 'Basándome en tu objetivo de volumen, te recomiendo...' },
  { id: '3', title: 'Ajuste de rutina de piernas', date: 'Hace 3 días', preview: 'Entendido, añado sentadilla búlgara como alternativa...' },
]

export default function ChatListPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Chat IA</h1>
          <p className="text-text-secondary text-sm mt-1">Tu entrenador personal siempre disponible</p>
        </div>
        <Link
          href="/chat/new"
          className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        >
          <span>+</span> Nuevo chat
        </Link>
      </div>

      {/* Message limit banner */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm font-medium">Mensajes usados hoy</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 max-w-40 h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-[#FF471A] rounded-full" />
            </div>
            <span className="text-text-primary text-sm font-bold">3 / 5</span>
          </div>
        </div>
        <Link
          href="/pricing"
          className="bg-[#FF471A1A] hover:bg-[#FF471A33] border border-[#FF471A33] text-[#FF471A] text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Ir a Premium
        </Link>
      </div>

      {/* Chat list */}
      <div className="space-y-3">
        {mockChats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="flex items-start gap-4 bg-bg-secondary border border-border-default hover:border-[#FF471A44] rounded-2xl p-4 transition-all group"
          >
            <div className="w-10 h-10 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[#FF471A] text-lg">💬</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-text-primary font-semibold text-sm truncate group-hover:text-[#FF471A] transition-colors">
                  {chat.title}
                </p>
                <span className="text-text-muted text-xs shrink-0">{chat.date}</span>
              </div>
              <p className="text-text-muted text-xs truncate">{chat.preview}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-text-muted text-xs mt-6">
        Plan Free: máximo 3 chats guardados.{' '}
        <Link href="/pricing" className="text-[#FF471A] hover:underline">
          Hazte Premium
        </Link>{' '}
        para chats ilimitados.
      </p>
    </div>
  )
}
