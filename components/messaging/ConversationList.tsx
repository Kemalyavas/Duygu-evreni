'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useStore } from '@/lib/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { useAuth, useBlocking, useNicknames } from '@/lib/hooks'
import { useTranslation } from '@/lib/i18n'
import type { ConversationWithDetails } from '@/types'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  onSelect?: (conversation: ConversationWithDetails) => void
  onDelete?: (conversationId: string) => Promise<unknown>
}

export function ConversationList({ conversations, onSelect, onDelete }: ConversationListProps) {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const { activeConversation, setActiveConversation, setMessagingPanelOpen } = useStore(
    useShallow((s) => ({
      activeConversation: s.activeConversation,
      setActiveConversation: s.setActiveConversation,
      setMessagingPanelOpen: s.setMessagingPanelOpen,
    }))
  )
  const { blockedUsers, fetchBlockedUsers } = useBlocking()
  const { nicknames, fetchNicknames, getNickname } = useNicknames()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const dateLocale = language === 'tr' ? tr : enUS

  // Fetch blocked users and nicknames on mount
  useEffect(() => {
    if (user) {
      fetchBlockedUsers()
      fetchNicknames()
    }
  }, [user, fetchBlockedUsers, fetchNicknames])

  const handleSelect = (conv: ConversationWithDetails) => {
    setActiveConversation(conv)
    setMessagingPanelOpen(true)
    onSelect?.(conv)
  }

  const handleDelete = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation() // Prevent selecting the conversation
    if (!onDelete || deletingId) return

    setDeletingId(convId)
    try {
      await onDelete(convId)
      // If deleted conversation was active, clear it
      if (activeConversation?.id === convId) {
        setActiveConversation(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">{t('messages.noChats')}</p>
        <p className="text-white/30 text-xs mt-1">{t('messages.noChatsDesc')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isActive = activeConversation?.id === conv.id
        const otherUser = conv.initiator_id === user?.id ? conv.star_owner : conv.initiator
        const otherUserId = otherUser?.id

        // Check if other user is blocked
        const isBlocked = otherUserId
          ? blockedUsers.some(b => b.blocked_id === otherUserId)
          : false

        // Get nickname for this conversation
        const nickname = getNickname(conv.id)

        // Respect privacy setting
        const otherUsername = (otherUser?.show_username_in_chats !== false && otherUser?.username)
          ? otherUser.username
          : t('common.anonymous')

        // Display name: nickname > username > anonymous
        const displayName = nickname || otherUsername

        return (
          <div
            key={conv.id}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(conv)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleSelect(conv)
              }
            }}
            className={`w-full text-left p-3 rounded-xl transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
              isActive
                ? 'bg-cyan-500/20 border border-cyan-500/30'
                : isBlocked
                  ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/10'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
            } ${isBlocked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isBlocked
                  ? 'bg-gradient-to-br from-red-500/20 to-red-500/10'
                  : 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30'
              }`}>
                <span className={`text-sm font-medium ${isBlocked ? 'text-red-300/80' : 'text-white/80'}`}>
                  {displayName[0]?.toUpperCase() || '?'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-medium text-sm truncate ${isBlocked ? 'text-white/50' : 'text-white'}`}>
                      {displayName}
                    </span>
                    {nickname && (
                      <span className="text-white/30 text-xs truncate hidden sm:inline">
                        ({otherUsername})
                      </span>
                    )}
                    {isBlocked && (
                      <span className="text-red-400/80 text-xs flex-shrink-0 px-1.5 py-0.5 bg-red-500/10 rounded">
                        {t('chat.blocked')}
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 text-xs flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false, locale: dateLocale })}
                  </span>
                </div>
                {conv.last_message?.content && (
                  <p className={`text-xs truncate mt-0.5 ${isBlocked ? 'text-white/30' : 'text-white/50'}`}>
                    {conv.last_message.content}
                  </p>
                )}
              </div>

              {/* Unread indicator - hide for blocked */}
              {!isBlocked && (conv.unread_count ?? 0) > 0 && (
                <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">{conv.unread_count}</span>
                </div>
              )}

              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  disabled={deletingId === conv.id}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title={t('messages.deleteChat')}
                >
                  {deletingId === conv.id ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
