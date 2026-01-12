'use client'

import { useState, useCallback, useRef } from 'react'
import { supabaseFetch, supabaseInsert, supabaseUpdate, createClient } from '@/lib/supabase/fetch'
import type { Conversation, ConversationWithDetails } from '@/types'

const MAX_DAILY_REQUESTS = 5

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [pendingRequests, setPendingRequests] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  // Kullanıcının tüm sohbetlerini getir (kabul edilmiş olanlar, gizlenmemiş)
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<(ConversationWithDetails & { hidden_by_initiator: boolean; hidden_by_owner: boolean })[]>('conversations', {
        select: '*, star:stars(*), initiator:profiles!conversations_initiator_id_fkey(id, username, show_username_in_chats), star_owner:profiles!conversations_star_owner_id_fkey(id, username, show_username_in_chats), hidden_by_initiator, hidden_by_owner',
        filter: `or=(initiator_id.eq.${session.user.id},star_owner_id.eq.${session.user.id})&status=eq.accepted`,
        order: 'updated_at.desc',
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)

      // Filter out hidden conversations for current user
      const visibleConversations = (data || []).filter(conv => {
        const isInitiator = conv.initiator_id === session.user.id
        if (isInitiator) {
          return !conv.hidden_by_initiator
        } else {
          return !conv.hidden_by_owner
        }
      })

      if (isMountedRef.current) {
        setConversations(visibleConversations)
      }
      return visibleConversations
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sohbetler yüklenemedi')
      }
      return []
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  // Bekleyen mesaj isteklerini getir (yıldız sahibi olarak)
  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<ConversationWithDetails[]>('conversations', {
        select: '*, star:stars(*), initiator:profiles!conversations_initiator_id_fkey(id, username, show_username_in_chats)',
        filter: `star_owner_id=eq.${session.user.id}&status=eq.pending`,
        order: 'created_at.desc',
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)

      if (isMountedRef.current) {
        setPendingRequests(data || [])
      }
      return data || []
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'İstekler yüklenemedi')
      }
      return []
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  // Gönderdiğim istekleri getir
  const fetchSentRequests = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<ConversationWithDetails[]>('conversations', {
        select: '*, star:stars(*)',
        filter: `initiator_id=eq.${session.user.id}&status=eq.pending`,
        order: 'created_at.desc',
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)
      return data || []
    } catch {
      return []
    }
  }, [])

  // Mesaj isteği gönder
  const sendMessageRequest = useCallback(async (starId: string, starOwnerId: string, firstMessage: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')
      if (session.user.id === starOwnerId) throw new Error('Kendi yıldızınıza mesaj gönderemezsiniz')

      // Profil bilgilerini al (admin kontrolü + günlük limit)
      const { data: profile } = await supabaseFetch<{ daily_message_requests_sent: number; is_admin: boolean }>('profiles', {
        filter: `id=eq.${session.user.id}`,
        select: 'daily_message_requests_sent, is_admin',
        single: true,
        accessToken: session.access_token,
      })

      const isAdmin = profile?.is_admin || false
      const currentRequests = profile?.daily_message_requests_sent || 0

      // Admin için limit kontrolü yok
      if (!isAdmin && currentRequests >= MAX_DAILY_REQUESTS) {
        throw new Error('Günlük mesaj isteği limitinize ulaştınız (5/5)')
      }

      // Admin için engel kontrolü yok (engellenemez)
      if (!isAdmin) {
        const { data: blocked } = await supabaseFetch<{ id: string }[]>('blocked_users', {
          filter: `blocker_id=eq.${starOwnerId}&blocked_id=eq.${session.user.id}`,
          accessToken: session.access_token,
        })

        if (blocked && blocked.length > 0) {
          throw new Error('Bu kullanıcıya mesaj gönderemezsiniz')
        }
      }

      // Bu kullanıcıyla zaten bir sohbet var mı kontrol et (herhangi bir yıldızdan)
      const { data: existingConversations } = await supabaseFetch<{ id: string; status: string }[]>('conversations', {
        select: 'id, status',
        filter: `or=(and(initiator_id.eq.${session.user.id},star_owner_id.eq.${starOwnerId}),and(initiator_id.eq.${starOwnerId},star_owner_id.eq.${session.user.id}))`,
        accessToken: session.access_token,
      })

      if (existingConversations && existingConversations.length > 0) {
        // Aktif (pending veya accepted) sohbet varsa engelle
        const hasActiveConversation = existingConversations.some(c => c.status === 'pending' || c.status === 'accepted')
        if (hasActiveConversation) {
          throw new Error('Bu kullanıcıyla zaten bir sohbetiniz var')
        }

        // Rejected conversation varsa, onu güncelle (tekrar istek gönderme)
        const rejectedConversation = existingConversations.find(c => c.status === 'rejected')
        if (rejectedConversation) {
          // Admin için direkt accepted, normal kullanıcılar için pending
          const newStatus = isAdmin ? 'accepted' : 'pending'
          const updateData: Record<string, unknown> = {
            star_id: starId,
            first_message: firstMessage,
            status: newStatus,
            created_at: new Date().toISOString(),
          }

          if (isAdmin) {
            updateData.accepted_at = new Date().toISOString()
          } else {
            updateData.accepted_at = null
          }

          const { error: updateError } = await supabaseUpdate<Conversation>(
            'conversations',
            `id=eq.${rejectedConversation.id}`,
            updateData,
            session.access_token
          )

          if (updateError) throw new Error(updateError)

          // Admin için günlük sayaç artırmaya gerek yok
          if (!isAdmin) {
            await supabaseUpdate('profiles',
              `id=eq.${session.user.id}`,
              { daily_message_requests_sent: currentRequests + 1 },
              session.access_token
            )
          }

          return { id: rejectedConversation.id } as Conversation
        }
      }

      // Admin için direkt accepted, normal kullanıcılar için pending
      const conversationStatus = isAdmin ? 'accepted' : 'pending'
      const conversationData: Record<string, unknown> = {
        star_id: starId,
        initiator_id: session.user.id,
        star_owner_id: starOwnerId,
        first_message: firstMessage,
        status: conversationStatus,
      }

      if (isAdmin) {
        conversationData.accepted_at = new Date().toISOString()
      }

      // Yeni conversation oluştur
      const { data, error: insertError } = await supabaseInsert<Conversation>('conversations', conversationData, session.access_token)

      if (insertError) {
        if (insertError.includes('duplicate') || insertError.includes('unique')) {
          throw new Error('Bu yıldıza zaten mesaj isteği gönderdiniz')
        }
        throw new Error(insertError)
      }

      // Admin için günlük sayaç artırmaya gerek yok
      if (!isAdmin) {
        await supabaseUpdate('profiles',
          `id=eq.${session.user.id}`,
          { daily_message_requests_sent: currentRequests + 1 },
          session.access_token
        )
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mesaj isteği gönderilemedi'
      if (isMountedRef.current) setError(message)
      throw new Error(message)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  // Mesaj isteğini kabul et veya reddet
  const respondToRequest = useCallback(async (conversationId: string, accept: boolean) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')

      const updateData = accept
        ? { status: 'accepted', accepted_at: new Date().toISOString() }
        : { status: 'rejected' }

      const { error: updateError } = await supabaseUpdate<Conversation>(
        'conversations',
        `id=eq.${conversationId}&star_owner_id=eq.${session.user.id}`,
        updateData,
        session.access_token
      )

      if (updateError) throw new Error(updateError)

      // Listeyi güncelle
      await fetchPendingRequests()

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İşlem başarısız'
      if (isMountedRef.current) setError(message)
      throw new Error(message)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [fetchPendingRequests])

  // Bu kullanıcıyla zaten bir sohbet var mı kontrol et
  const checkExistingConversation = useCallback(async (targetUserId: string): Promise<{ exists: boolean; conversationId?: string }> => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return { exists: false }
      if (session.user.id === targetUserId) return { exists: false }

      const { data: existingConversations } = await supabaseFetch<{ id: string; status: string }[]>('conversations', {
        select: 'id, status',
        filter: `or=(and(initiator_id.eq.${session.user.id},star_owner_id.eq.${targetUserId}),and(initiator_id.eq.${targetUserId},star_owner_id.eq.${session.user.id}))`,
        accessToken: session.access_token,
      })

      if (existingConversations && existingConversations.length > 0) {
        const activeConversation = existingConversations.find(c => c.status === 'pending' || c.status === 'accepted')
        if (activeConversation) {
          return { exists: true, conversationId: activeConversation.id }
        }
      }

      return { exists: false }
    } catch {
      return { exists: false }
    }
  }, [])

  // Günlük kalan istek sayısını getir (admin için sınırsız: -1)
  const getRemainingRequests = useCallback(async (): Promise<number> => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return MAX_DAILY_REQUESTS

      const { data: profile } = await supabaseFetch<{ daily_message_requests_sent: number; is_admin: boolean }>('profiles', {
        filter: `id=eq.${session.user.id}`,
        select: 'daily_message_requests_sent, is_admin',
        single: true,
        accessToken: session.access_token,
      })

      // Admin için sınırsız (-1)
      if (profile?.is_admin) return -1

      return MAX_DAILY_REQUESTS - (profile?.daily_message_requests_sent || 0)
    } catch {
      return MAX_DAILY_REQUESTS
    }
  }, [])

  // Sohbeti gizle (sil)
  const hideConversation = useCallback(async (conversationId: string) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')

      // Get conversation to determine user role
      const { data: conv } = await supabaseFetch<{ initiator_id: string; star_owner_id: string }>('conversations', {
        filter: `id=eq.${conversationId}`,
        select: 'initiator_id, star_owner_id',
        single: true,
        accessToken: session.access_token,
      })

      if (!conv) throw new Error('Sohbet bulunamadı')

      const isInitiator = conv.initiator_id === session.user.id
      const updateField = isInitiator ? 'hidden_by_initiator' : 'hidden_by_owner'

      const { error: updateError } = await supabaseUpdate(
        'conversations',
        `id=eq.${conversationId}`,
        { [updateField]: true },
        session.access_token
      )

      if (updateError) throw new Error(updateError)

      // Update local state
      if (isMountedRef.current) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sohbet silinemedi'
      if (isMountedRef.current) setError(message)
      throw new Error(message)
    }
  }, [])

  return {
    conversations,
    pendingRequests,
    loading,
    error,
    fetchConversations,
    fetchPendingRequests,
    fetchSentRequests,
    sendMessageRequest,
    respondToRequest,
    getRemainingRequests,
    checkExistingConversation,
    hideConversation,
    pendingCount: pendingRequests.length,
    maxDailyRequests: MAX_DAILY_REQUESTS,
  }
}
