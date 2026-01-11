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

  // Kullanıcının tüm sohbetlerini getir (kabul edilmiş olanlar)
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<ConversationWithDetails[]>('conversations', {
        select: '*, star:stars(*), initiator:profiles!conversations_initiator_id_fkey(*), star_owner:profiles!conversations_star_owner_id_fkey(*)',
        filter: `or=(initiator_id.eq.${session.user.id},star_owner_id.eq.${session.user.id})&status=eq.accepted`,
        order: 'updated_at.desc',
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)

      if (isMountedRef.current) {
        setConversations(data || [])
      }
      return data || []
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
        select: '*, star:stars(*), initiator:profiles!conversations_initiator_id_fkey(id, username)',
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

      // Günlük limit kontrolü
      const { data: profile } = await supabaseFetch<{ daily_message_requests_sent: number }>('profiles', {
        filter: `id=eq.${session.user.id}`,
        select: 'daily_message_requests_sent',
        single: true,
        accessToken: session.access_token,
      })

      const currentRequests = profile?.daily_message_requests_sent || 0
      if (currentRequests >= MAX_DAILY_REQUESTS) {
        throw new Error('Günlük mesaj isteği limitinize ulaştınız (5/5)')
      }

      // Engel kontrolü
      const { data: blocked } = await supabaseFetch<{ id: string }[]>('blocked_users', {
        filter: `blocker_id=eq.${starOwnerId}&blocked_id=eq.${session.user.id}`,
        accessToken: session.access_token,
      })

      if (blocked && blocked.length > 0) {
        throw new Error('Bu kullanıcıya mesaj gönderemezsiniz')
      }

      // Conversation oluştur
      const { data, error: insertError } = await supabaseInsert<Conversation>('conversations', {
        star_id: starId,
        initiator_id: session.user.id,
        star_owner_id: starOwnerId,
        first_message: firstMessage,
        status: 'pending',
      }, session.access_token)

      if (insertError) {
        if (insertError.includes('duplicate') || insertError.includes('unique')) {
          throw new Error('Bu yıldıza zaten mesaj isteği gönderdiniz')
        }
        throw new Error(insertError)
      }

      // Günlük sayacı artır
      await supabaseUpdate('profiles',
        `id=eq.${session.user.id}`,
        { daily_message_requests_sent: currentRequests + 1 },
        session.access_token
      )

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

  // Günlük kalan istek sayısını getir
  const getRemainingRequests = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return MAX_DAILY_REQUESTS

      const { data: profile } = await supabaseFetch<{ daily_message_requests_sent: number }>('profiles', {
        filter: `id=eq.${session.user.id}`,
        select: 'daily_message_requests_sent',
        single: true,
        accessToken: session.access_token,
      })

      return MAX_DAILY_REQUESTS - (profile?.daily_message_requests_sent || 0)
    } catch {
      return MAX_DAILY_REQUESTS
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
    pendingCount: pendingRequests.length,
    maxDailyRequests: MAX_DAILY_REQUESTS,
  }
}
