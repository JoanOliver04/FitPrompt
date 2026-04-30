import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getChatWithMessages } from '@/lib/chat'
import ChatInterface from '@/components/chat/ChatInterface'
import type { Message } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { title: 'Chat — FitPrompt' }

  const chat = await getChatWithMessages(id, session.user.id)
  return { title: `${chat?.title ?? 'Chat'} — FitPrompt` }
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const chat = await getChatWithMessages(id, session.user.id)
  if (!chat) redirect('/chat')

  // Map DB rows to the Message type used by the client
  const initialMessages: Message[] = chat.messages.map((m) => ({
    id: m.id,
    chatId: id,
    role: m.role,
    content: m.content,
    createdAt: new Date(m.createdAt),
  }))

  return (
    <ChatInterface
      chatId={id}
      title={chat.title}
      initialMessages={initialMessages}
    />
  )
}
