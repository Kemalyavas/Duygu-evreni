'use client'

import { useState, useCallback } from 'react'
import { supabaseFetch, supabaseInsert, createClient } from '@/lib/supabase/fetch'
import type { BlockedUser, Report, ReportReason } from '@/types'

export function useBlocking() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Engellenen kullanıcıları getir
  const fetchBlockedUsers = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return []

      const { data, error: fetchError } = await supabaseFetch<BlockedUser[]>('blocked_users', {
        filter: `blocker_id=eq.${session.user.id}`,
        accessToken: session.access_token,
      })

      if (fetchError) throw new Error(fetchError)

      setBlockedUsers(data || [])
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Engellenen kullanıcılar yüklenemedi')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Kullanıcıyı engelle
  const blockUser = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')
      if (session.user.id === userId) throw new Error('Kendinizi engelleyemezsiniz')

      const { error: insertError } = await supabaseInsert('blocked_users', {
        blocker_id: session.user.id,
        blocked_id: userId,
      }, session.access_token)

      if (insertError) {
        if (insertError.includes('duplicate') || insertError.includes('unique')) {
          throw new Error('Bu kullanıcı zaten engelli')
        }
        throw new Error(insertError)
      }

      await fetchBlockedUsers()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Engelleme başarısız'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchBlockedUsers])

  // Engeli kaldır
  const unblockUser = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')

      // DELETE için özel fetch
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const response = await fetch(
        `${supabaseUrl}/rest/v1/blocked_users?blocker_id=eq.${session.user.id}&blocked_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Engel kaldırılamadı')
      }

      await fetchBlockedUsers()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Engel kaldırılamadı'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchBlockedUsers])

  // Kullanıcıyı bildir
  const reportUser = useCallback(async (
    userId: string,
    reason: ReportReason,
    conversationId?: string,
    description?: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) throw new Error('Giriş yapmanız gerekiyor')
      if (session.user.id === userId) throw new Error('Kendinizi bildiremezsiniz')

      const { error: insertError } = await supabaseInsert<Report>('reports', {
        reporter_id: session.user.id,
        reported_user_id: userId,
        conversation_id: conversationId || null,
        reason,
        description: description || null,
      }, session.access_token)

      if (insertError) throw new Error(insertError)

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bildirme başarısız'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Kullanıcının engellenip engellenmediğini kontrol et
  const isBlocked = useCallback((userId: string) => {
    return blockedUsers.some(b => b.blocked_id === userId)
  }, [blockedUsers])

  return {
    blockedUsers,
    loading,
    error,
    fetchBlockedUsers,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
  }
}
