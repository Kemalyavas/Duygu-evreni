'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useNotifications, useConversations, useAuth } from '@/lib/hooks'
import { useStore } from '@/lib/store/useStore'
import { useTranslation } from '@/lib/i18n'
import { supabaseFetch, createClient } from '@/lib/supabase/fetch'
import type { NotificationWithSender, NotificationType, ConversationWithDetails } from '@/types'

interface NotificationListProps {
  onClose?: () => void
  showHeader?: boolean
}

// Bildirim tipine göre ikon
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'message_request':
      return (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    case 'request_accepted':
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'new_message':
      return (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    case 'new_conversation':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
  }
}

// Bildirim tipine göre arka plan rengi
function getNotificationBgColor(type: NotificationType, isRead: boolean) {
  if (isRead) return 'bg-white/5'

  switch (type) {
    case 'message_request':
      return 'bg-purple-500/10 border-l-2 border-purple-500'
    case 'request_accepted':
      return 'bg-green-500/10 border-l-2 border-green-500'
    case 'new_message':
      return 'bg-cyan-500/10 border-l-2 border-cyan-500'
    case 'new_conversation':
      return 'bg-yellow-500/10 border-l-2 border-yellow-500'
  }
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  deleteTitle,
  dateLocale,
  anonymousText,
}: {
  notification: NotificationWithSender
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (notification: NotificationWithSender) => void
  deleteTitle: string
  dateLocale: typeof tr | typeof enUS
  anonymousText: string
}) {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }
    onClick(notification)
  }

  // Privacy check: if sender has show_username_in_chats = false, replace username with "Anonymous"
  let displayTitle = notification.title
  let displayBody = notification.body

  if (notification.sender && notification.sender.show_username_in_chats === false && notification.sender.username) {
    const username = notification.sender.username
    displayTitle = displayTitle.replace(username, anonymousText)
    if (displayBody) {
      displayBody = displayBody.replace(username, anonymousText)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={`group relative p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/10 ${getNotificationBgColor(notification.type, notification.is_read)}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.is_read ? 'text-white/60' : 'text-white font-medium'}`}>
            {displayTitle}
          </p>
          {displayBody && (
            <p className="text-white/40 text-xs mt-0.5 line-clamp-2">
              {displayBody}
            </p>
          )}
          <p className="text-white/30 text-[10px] mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white/60"
            title={deleteTitle}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Unread dot */}
        {!notification.is_read && (
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400" />
        )}
      </div>
    </motion.div>
  )
}

export function NotificationList({ onClose, showHeader = true }: NotificationListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const dateLocale = language === 'tr' ? tr : enUS
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()
  const { conversations } = useConversations()
  const { setActiveConversation } = useStore()

  const handleNotificationClick = async (notification: NotificationWithSender) => {
    // Sohbet varsa, direkt sohbeti aç (sayfa fark etmez)
    if (notification.conversation_id) {
      // Önce local listeden bak
      let conversation = conversations.find(c => c.id === notification.conversation_id)

      // Yoksa fetch et
      if (!conversation && user) {
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.access_token) {
            const { data } = await supabaseFetch<ConversationWithDetails[]>(
              'conversations',
              {
                select: `
                  *,
                  star:stars(id, content, planet_id),
                  initiator:profiles!conversations_initiator_id_fkey(id, username, show_username_in_chats),
                  owner:profiles!conversations_star_owner_id_fkey(id, username, show_username_in_chats)
                `,
                filter: `id=eq.${notification.conversation_id}`,
                single: true,
                accessToken: session.access_token,
              }
            )
            if (data) {
              conversation = Array.isArray(data) ? data[0] : data
            }
          }
        } catch (err) {
          console.error('[NotificationList] Failed to fetch conversation:', err)
        }
      }

      if (conversation) {
        setActiveConversation(conversation)
      } else {
        // Hala bulunamadıysa profil sayfasına git
        router.push(`/profil?conversation=${notification.conversation_id}`)
      }
    } else if (notification.type === 'message_request') {
      // Mesaj isteği bildirimi ise profil sayfasına git (istekler orada)
      router.push('/profil')
    }

    onClose?.()
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
            >
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">{t('notifications.empty')}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleNotificationClick}
                deleteTitle={t('common.delete')}
                dateLocale={dateLocale}
                anonymousText={t('common.anonymous')}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && showHeader && (
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => {
              router.push('/profil')
              onClose?.()
            }}
            className="w-full text-center text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
          >
            {t('notifications.viewAll')}
          </button>
        </div>
      )}
    </div>
  )
}
