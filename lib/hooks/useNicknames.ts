'use client'

import { useState, useCallback } from 'react'
import { supabaseFetch, supabaseInsert, createClient } from '@/lib/supabase/fetch'
import type { ConversationNickname } from '@/types'

export function useNicknames() {
  const [nicknames, setNicknames] = useState<ConversationNickname[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tüm takma adları getir
  const fetchNicknames = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<ConversationNickname[]>('conversation_nicknames', {
        filter: `user_id=eq.${session.user.id}`,
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)

      setNicknames(data || [])
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Takma adlar yüklenemedi')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Takma ad ekle veya güncelle (upsert)
  const setNickname = useCallback(async (conversationId: string, nickname: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')

      const trimmedNickname = nickname.trim()
      if (!trimmedNickname) throw new Error('Takma ad boş olamaz')
      if (trimmedNickname.length > 50) throw new Error('Takma ad en fazla 50 karakter olabilir')

      // Önce mevcut takma adı kontrol et
      const { data: existing } = await supabaseFetch<ConversationNickname[]>('conversation_nicknames', {
        filter: `conversation_id=eq.${conversationId}&user_id=eq.${session.user.id}`,
        accessToken: session.access_token,
      })

      if (existing && existing.length > 0) {
        // Güncelle
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const response = await fetch(
          `${supabaseUrl}/rest/v1/conversation_nicknames?conversation_id=eq.${conversationId}&user_id=eq.${session.user.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ nickname: trimmedNickname }),
          }
        )

        if (!response.ok) throw new Error('Takma ad güncellenemedi')
      } else {
        // Yeni ekle
        const { error: insertError } = await supabaseInsert('conversation_nicknames', {
          conversation_id: conversationId,
          user_id: session.user.id,
          nickname: trimmedNickname,
        }, session.access_token)

        if (insertError) throw new Error(insertError)
      }

      await fetchNicknames()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Takma ad kaydedilemedi'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchNicknames])

  // Takma adı sil
  const removeNickname = useCallback(async (conversationId: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const response = await fetch(
        `${supabaseUrl}/rest/v1/conversation_nicknames?conversation_id=eq.${conversationId}&user_id=eq.${session.user.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Takma ad silinemedi')

      await fetchNicknames()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Takma ad silinemedi'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchNicknames])

  // Belirli bir conversation için takma adı getir
  const getNickname = useCallback((conversationId: string): string | null => {
    const found = nicknames.find(n => n.conversation_id === conversationId)
    return found?.nickname || null
  }, [nicknames])

  return {
    nicknames,
    loading,
    error,
    fetchNicknames,
    setNickname,
    removeNickname,
    getNickname,
  }
}
