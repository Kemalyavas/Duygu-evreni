'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabaseFetch, supabaseUpdate } from '@/lib/supabase/fetch'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { useStore } from '@/lib/store/useStore'
import type { Notification, NotificationWithSender } from '@/types'

// Notification sound player
let notificationAudio: HTMLAudioElement | null = null

function playNotificationSound() {
  try {
    // Create audio element lazily
    if (!notificationAudio) {
      notificationAudio = new Audio('/sounds/notification.mp3')
      notificationAudio.volume = 0.5
    }
    // Reset and play
    notificationAudio.currentTime = 0
    notificationAudio.play().catch(() => {
      // Autoplay might be blocked - ignore silently
    })
  } catch {
    // Audio not supported - ignore
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const setUnreadNotificationsCount = useStore((s) => s.setUnreadNotificationsCount)

  // Bildirimleri getir
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return []
      }

      // Önce bildirimleri al (sender bilgisi olmadan)
      const { data: rawNotifications, error: fetchError } = await supabaseFetch<Notification[]>(
        'notifications',
        {
          select: '*',
          filter: `user_id=eq.${session.user.id}`,
          order: 'created_at.desc',
          limit: 50,
          accessToken: session.access_token,
        }
      )

      if (fetchError) {
        throw new Error(fetchError)
      }

      // Sender ID'lerini topla ve profilleri al
      const senderIds = [...new Set((rawNotifications || []).filter(n => n.sender_id).map(n => n.sender_id as string))]
      let senderProfiles: Record<string, { id: string; username: string; show_username_in_chats: boolean }> = {}

      if (senderIds.length > 0) {
        const { data: profiles } = await supabaseFetch<{ id: string; username: string; show_username_in_chats: boolean }[]>(
          'profiles',
          {
            select: 'id,username,show_username_in_chats',
            filter: `id=in.(${senderIds.join(',')})`,
            accessToken: session.access_token,
          }
        )
        if (profiles) {
          senderProfiles = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
        }
      }

      // Bildirimlere sender bilgisini ekle
      const data: NotificationWithSender[] = (rawNotifications || []).map(n => ({
        ...n,
        sender: n.sender_id ? senderProfiles[n.sender_id] || undefined : undefined,
      }))

      if (isMountedRef.current) {
        setNotifications(data)
        const unreadCount = data.filter(n => !n.is_read).length
        setUnreadNotificationsCount(unreadCount)
      }

      return data
    } catch (err) {
      console.error('[Notifications] Error:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Bildirimler yüklenemedi')
      }
      return []
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [setUnreadNotificationsCount])

  // Tek bildirimi okundu olarak işaretle
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return

      await supabaseUpdate(
        'notifications',
        `id=eq.${notificationId}`,
        { is_read: true },
        session.access_token
      )

      // Lokal state güncelle
      if (isMountedRef.current) {
        setNotifications(prev => {
          const updated = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
          // Yeni unread count hesapla
          const newUnreadCount = updated.filter(n => !n.is_read).length
          setUnreadNotificationsCount(newUnreadCount)
          return updated
        })
      }
    } catch {
      // Silent fail
    }
  }, [setUnreadNotificationsCount])

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return

      await supabaseUpdate(
        'notifications',
        `user_id=eq.${session.user.id}&is_read=eq.false`,
        { is_read: true },
        session.access_token
      )

      // Lokal state güncelle
      if (isMountedRef.current) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadNotificationsCount(0)
      }
    } catch {
      // Silent fail
    }
  }, [setUnreadNotificationsCount])

  // Bildirim sil
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return

      // Silinen bildirimi bul (unread count için)
      const deletedNotification = notifications.find(n => n.id === notificationId)

      // REST API ile sil
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Silme başarısız')

      // Lokal state güncelle
      if (isMountedRef.current) {
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== notificationId)
          // Yeni unread count hesapla
          const newUnreadCount = filtered.filter(n => !n.is_read).length
          setUnreadNotificationsCount(newUnreadCount)
          return filtered
        })
      }
    } catch {
      // Silent fail
    }
  }, [setUnreadNotificationsCount])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Eğer zaten bir kanal varsa, kapat
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }

      const channel = supabase
        .channel(`notifications:${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          async (payload: { new: Record<string, unknown> }) => {
            const newNotification = payload.new as unknown as Notification

            // State'e ekle (en başa)
            if (isMountedRef.current) {
              setNotifications(prev => {
                // Duplicate kontrolü
                if (prev.some(n => n.id === newNotification.id)) return prev

                // Play notification sound for new notifications
                playNotificationSound()

                const updated = [newNotification as NotificationWithSender, ...prev]
                // Yeni unread count hesapla
                const newUnreadCount = updated.filter(n => !n.is_read).length
                setUnreadNotificationsCount(newUnreadCount)
                return updated
              })
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            const updated = payload.new as unknown as Notification
            if (isMountedRef.current) {
              setNotifications(prev =>
                prev.map(n => n.id === updated.id ? { ...n, ...updated } : n)
              )
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload: { old: Record<string, unknown> }) => {
            const deleted = payload.old as unknown as Notification
            if (isMountedRef.current) {
              setNotifications(prev => prev.filter(n => n.id !== deleted.id))
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    setupSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [setUnreadNotificationsCount])

  // Auth state change listener - session değiştiğinde bildirimleri yeniden fetch et
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      // INITIAL_SESSION: sayfa yenilendiğinde, SIGNED_IN: giriş yapıldığında, TOKEN_REFRESHED: token yenilendiğinde
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchNotifications()
      } else if (event === 'SIGNED_OUT') {
        // Çıkış yapıldığında bildirimleri temizle
        if (isMountedRef.current) {
          setNotifications([])
          setUnreadNotificationsCount(0)
        }
      }
    })

    // onAuthStateChange INITIAL_SESSION event'i zaten fetch yapacak,
    // ayrıca burada tekrar çağırmaya gerek yok (çift fetch önleme)

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchNotifications, setUnreadNotificationsCount])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Unread count hesapla
  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
