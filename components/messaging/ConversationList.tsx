'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useStore } from '@/lib/store/useStore'
import { useAuth } from '@/lib/hooks'
import type { ConversationWithDetails } from '@/types'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  onSelect?: (conversation: ConversationWithDetails) => void
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  const { user } = useAuth()
  const { activeConversation, setActiveConversation, setMessagingPanelOpen } = useStore()

  const handleSelect = (conv: ConversationWithDetails) => {
    setActiveConversation(conv)
    setMessagingPanelOpen(true)
    onSelect?.(conv)
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">Henüz sohbet yok</p>
        <p className="text-white/30 text-xs mt-1">Yıldızlara mesaj göndererek sohbet başlat</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isActive = activeConversation?.id === conv.id
        const otherUser = conv.initiator_id === user?.id ? conv.star_owner : conv.initiator
        // Respect privacy setting
        const otherUsername = (otherUser?.show_username_in_chats !== false && otherUser?.username)
          ? otherUser.username
          : 'Anonim'

        return (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv)}
            className={`w-full text-left p-3 rounded-xl transition-colors ${
              isActive
                ? 'bg-cyan-500/20 border border-cyan-500/30'
                : 'bg-white/5 hover:bg-white/10 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-white/80 text-sm font-medium">
                  {otherUsername[0]?.toUpperCase() || '?'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-medium text-sm truncate">
                    {otherUsername}
                  </span>
                  <span className="text-white/40 text-xs flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false, locale: tr })}
                  </span>
                </div>
                <p className="text-white/50 text-xs truncate mt-0.5">
                  {conv.last_message?.content || conv.first_message}
                </p>
              </div>

              {/* Unread indicator */}
              {conv.unread_count && conv.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">{conv.unread_count}</span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
