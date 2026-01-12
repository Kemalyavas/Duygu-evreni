'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabaseFetch, supabaseInsert, supabaseUpdate, createClient } from '@/lib/supabase/fetch'
import type { Message, MessageWithSender } from '@/types'

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  // Mesajları getir
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return []

    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<MessageWithSender[]>('messages', {
        filter: `conversation_id=eq.${conversationId}`,
        select: '*, sender:profiles!messages_sender_id_fkey(id, username)',
        order: 'created_at.asc',
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)

      if (isMountedRef.current) {
        setMessages(data || [])
      }
      return data || []
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi')
      }
      return []
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [conversationId])

  // Mesaj gönder
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) throw new Error('Sohbet seçilmedi')
    if (!content.trim()) throw new Error('Mesaj boş olamaz')
    if (content.length > 1000) throw new Error('Mesaj çok uzun (max 1000 karakter)')

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')

      const { data, error: insertError } = await supabaseInsert<Message>('messages', {
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: content.trim(),
      }, session.access_token)

      if (insertError) throw new Error(insertError)

      // Optimistic update - mesajı hemen ekle
      if (data && isMountedRef.current) {
        const newMessage: MessageWithSender = {
          ...data,
          sender: { id: session.user.id, username: null } as MessageWithSender['sender'],
        }
        setMessages(prev => [...prev, newMessage])
      }

      // Conversation'ın updated_at'ini güncelle
      await supabaseUpdate('conversations',
        `id=eq.${conversationId}`,
        { updated_at: new Date().toISOString() },
        session.access_token
      )

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mesaj gönderilemedi'
      if (isMountedRef.current) setError(message)
      throw new Error(message)
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [conversationId])

  // Mesajları okundu olarak işaretle
  const markAsRead = useCallback(async () => {
    if (!conversationId) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return

      await supabaseUpdate(
        'messages',
        `conversation_id=eq.${conversationId}&sender_id=neq.${session.user.id}&is_read=eq.false`,
        { is_read: true },
        session.access_token
      )

      // Lokal state'i güncelle
      if (isMountedRef.current) {
        setMessages(prev => prev.map(msg =>
          msg.sender_id !== session.user.id ? { ...msg, is_read: true } : msg
        ))
      }
    } catch {
      // Silent fail - kritik değil
    }
  }, [conversationId])

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const newMessage = payload.new as Message

          // Skip if message already exists (deduplication)
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev

            // Add message with undefined sender first, will be fetched below
            const messageWithSender: MessageWithSender = {
              ...newMessage,
              sender: undefined,
            }
            return [...prev, messageWithSender]
          })

          // Fetch sender info asynchronously and update
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: senderData } = await supabaseFetch<MessageWithSender['sender']>('profiles', {
              filter: `id=eq.${newMessage.sender_id}`,
              select: 'id, username',
              single: true,
              accessToken: session.access_token,
            })

            if (senderData && isMountedRef.current) {
              setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id
                  ? { ...msg, sender: senderData }
                  : msg
              ))
            }
          } catch {
            // Silent fail - sender info is not critical
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // conversationId değiştiğinde mesajları yükle
  useEffect(() => {
    if (conversationId) {
      fetchMessages()
    } else {
      setMessages([])
    }
  }, [conversationId, fetchMessages])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  }
}
