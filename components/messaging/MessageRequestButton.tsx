'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { useAuth, useConversations } from '@/lib/hooks'
import { supabaseFetch, createClient } from '@/lib/supabase/fetch'
import type { Star, ConversationWithDetails } from '@/types'

interface MessageRequestButtonProps {
  star: Star
}

export function MessageRequestButton({ star }: MessageRequestButtonProps) {
  const { user } = useAuth()
  const { setMessageRequestModalOpen, setSelectedStar, setActiveConversation, setMessagingPanelOpen, lastConversationCreatedAt } = useStore(
    useShallow((s) => ({
      setMessageRequestModalOpen: s.setMessageRequestModalOpen,
      setSelectedStar: s.setSelectedStar,
      setActiveConversation: s.setActiveConversation,
      setMessagingPanelOpen: s.setMessagingPanelOpen,
      lastConversationCreatedAt: s.lastConversationCreatedAt,
    }))
  )
  const { checkExistingConversation } = useConversations()
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Kullanıcıyla zaten bir sohbet var mı kontrol et
  // Also re-check when a new conversation is created (via lastConversationCreatedAt trigger)
  useEffect(() => {
    if (!user || user.id === star.user_id) {
      setChecking(false)
      return
    }

    const check = async () => {
      setChecking(true)
      const result = await checkExistingConversation(star.user_id)
      setExistingConversationId(result.exists ? result.conversationId || null : null)
      setChecking(false)
    }

    check()
  }, [user, star.user_id, checkExistingConversation, lastConversationCreatedAt])

  // Giriş yapmamışsa gösterme
  if (!user) return null

  // Kendi yıldızına mesaj gönderemez
  if (user.id === star.user_id) return null

  const handleNewMessage = () => {
    setSelectedStar(star)
    setMessageRequestModalOpen(true)
  }

  const handleGoToChat = async () => {
    if (!existingConversationId) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Sohbet detaylarını getir
      const { data: conversation } = await supabaseFetch<ConversationWithDetails>('conversations', {
        select: '*, star:stars(*), initiator:profiles!conversations_initiator_id_fkey(id, username, show_username_in_chats), star_owner:profiles!conversations_star_owner_id_fkey(id, username, show_username_in_chats)',
        filter: `id=eq.${existingConversationId}`,
        single: true,
        accessToken: session.access_token,
      })

      if (conversation) {
        setActiveConversation(conversation)
        setMessagingPanelOpen(true)
      }
    } catch {
      // Hata olursa sessizce başarısız ol
    }
  }

  // Kontrol ediliyorsa loading göster
  if (checking) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="w-full mt-4 bg-white/5 border-white/10"
      >
        <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Kontrol ediliyor...
      </Button>
    )
  }

  // Zaten sohbet varsa "Sohbete Git" göster
  if (existingConversationId) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleGoToChat}
        className="w-full mt-4 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Sohbete Git
      </Button>
    )
  }

  // Normal "Mesaj Gönder" butonu
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleNewMessage}
      className="w-full mt-4 bg-white/5 hover:bg-white/10 border-white/10"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      Mesaj Gönder
    </Button>
  )
}
