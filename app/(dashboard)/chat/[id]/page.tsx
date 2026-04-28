import type { Metadata } from 'next'
import ChatInterface from '@/components/chat/ChatInterface'

export const metadata: Metadata = {
  title: 'Chat',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  return <ChatInterface chatId={id} />
}
