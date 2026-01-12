'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store/useStore'
import { useMessages, useAuth, useMobile } from '@/lib/hooks'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

// Floating stars background component
function FloatingStars() {
  const stars = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.1,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, -10, 0],
            opacity: [star.opacity, star.opacity * 1.5, star.opacity],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-white"
            style={{ opacity: star.opacity }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

// Compact chat button component
function CompactChatButton({
  username,
  unreadCount,
  onClick,
}: {
  username: string
  unreadCount: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <button
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-[#0d0d1a] hover:border-white/20 transition-all shadow-lg shadow-black/20 group"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
            <span className="text-white/80 text-sm font-medium">
              {username[0]?.toUpperCase() || '?'}
            </span>
          </div>
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="text-left">
          <p className="text-white font-medium text-sm">{username}</p>
          <p className="text-white/40 text-xs">Sohbete dön</p>
        </div>

        {/* Expand icon */}
        <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </motion.div>
  )
}

export function ChatPanel() {
  const router = useRouter()
  const { user } = useAuth()
  const isMobile = useMobile()
  const {
    activeConversation,
    isMessagingPanelOpen,
    setMessagingPanelOpen,
    setActiveConversation,
    isChatCompact,
    setChatCompact,
  } = useStore()
  const { messages, sendMessage, loading, markAsRead } = useMessages(activeConversation?.id || null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [unreadInCompact, setUnreadInCompact] = useState(0)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when opened
  useEffect(() => {
    if (isMessagingPanelOpen && activeConversation && !isChatCompact) {
      markAsRead()
      setUnreadInCompact(0)
    }
  }, [isMessagingPanelOpen, activeConversation, isChatCompact, markAsRead])

  // Track unread messages while compact
  useEffect(() => {
    if (isChatCompact && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.sender_id !== user?.id && !lastMessage.is_read) {
        setUnreadInCompact(prev => prev + 1)
      }
    }
  }, [messages, isChatCompact, user?.id])

  const handleClose = () => {
    setMessagingPanelOpen(false)
    setActiveConversation(null)
    setChatCompact(false)
  }

  const handleMinimize = () => {
    setChatCompact(true)
  }

  const handleExpand = () => {
    setChatCompact(false)
    setUnreadInCompact(0)
  }

  // Navigate to the star that started this conversation
  const handleGoToStar = useCallback(() => {
    if (!activeConversation?.star) return

    const star = activeConversation.star
    const url = `/?planet=${star.planet_id}&star=${star.id}`

    // On mobile, close the chat (full screen)
    // On desktop, minimize to compact mode
    if (isMobile) {
      setMessagingPanelOpen(false)
      setActiveConversation(null)
    } else {
      setChatCompact(true)
    }

    router.push(url)
  }, [activeConversation, isMobile, router, setMessagingPanelOpen, setActiveConversation, setChatCompact])

  if (!isMessagingPanelOpen || !activeConversation) return null

  // Karşı tarafın bilgisi
  const otherUser = activeConversation.initiator_id === user?.id
    ? activeConversation.star_owner
    : activeConversation.initiator

  // Respect privacy setting: show username only if show_username_in_chats is true
  const otherUsername = (otherUser?.show_username_in_chats !== false && otherUser?.username)
    ? otherUser.username
    : 'Anonim'

  // Show compact button when minimized (desktop only)
  if (isChatCompact && !isMobile) {
    return (
      <AnimatePresence>
        <CompactChatButton
          username={otherUsername}
          unreadCount={unreadInCompact}
          onClick={handleExpand}
        />
      </AnimatePresence>
    )
  }

  // Desktop panel
  const desktopPanel = (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="hidden md:flex fixed right-0 top-0 bottom-0 w-[400px] bg-[#0d0d1a]/95 backdrop-blur-xl border-l border-white/10 z-40 flex-col"
    >
      {/* Floating stars background */}
      <FloatingStars />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <span className="text-white/80 text-sm font-medium">
                {otherUsername[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="text-white font-medium">{otherUsername}</h3>
              <p className="text-white/40 text-xs">Sohbet</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Minimize button */}
            <button
              onClick={handleMinimize}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Küçült"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Kapat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Yıldız bilgisi - tıklanabilir */}
        {activeConversation?.star && (
          <div className="px-4 pb-3">
            <button
              onClick={handleGoToStar}
              className="w-full text-left group"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-colors">
                <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <p className="text-white/40 text-xs truncate italic flex-1">
                  &ldquo;{activeConversation.star.content.slice(0, 40)}{activeConversation.star.content.length > 40 ? '...' : ''}&rdquo;
                </p>
                <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <p className="text-white/30 text-[10px] mt-1 text-center group-hover:text-white/50 transition-colors">
                Yıldıza gitmek için tıkla
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
        {/* Sohbet başladı */}
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">Sohbet başladı</p>
        </div>

        {/* İlk mesaj (mesaj isteğindeki yazı) */}
        {activeConversation.first_message && (
          <MessageBubble
            message={{
              id: 'first-message',
              conversation_id: activeConversation.id,
              sender_id: activeConversation.initiator_id,
              content: activeConversation.first_message,
              is_read: true,
              created_at: activeConversation.created_at,
            }}
            isOwn={activeConversation.initiator_id === user?.id}
          />
        )}

        {/* Mesajlar */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10">
        <MessageInput onSend={sendMessage} disabled={loading} />
      </div>
    </motion.div>
  )

  // Mobile bottom sheet
  const mobilePanel = (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="md:hidden fixed inset-0 bg-[#0d0d1a]/98 backdrop-blur-xl z-50 flex flex-col"
    >
      {/* Floating stars background */}
      <FloatingStars />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <span className="text-white/80 text-xs font-medium">
                {otherUsername[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-white font-medium">{otherUsername}</span>
          </div>
        </div>
        {/* Yıldız bilgisi - tıklanabilir */}
        {activeConversation?.star && (
          <div className="px-4 pb-3">
            <button
              onClick={handleGoToStar}
              className="w-full text-left group active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5 group-active:bg-white/10 transition-colors">
                <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <p className="text-white/40 text-xs truncate italic flex-1">
                  &ldquo;{activeConversation.star.content.slice(0, 40)}{activeConversation.star.content.length > 40 ? '...' : ''}&rdquo;
                </p>
                <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <p className="text-white/30 text-[10px] mt-1 text-center">
                Yıldıza gitmek için dokun
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">Sohbet başladı</p>
        </div>

        {/* İlk mesaj (mesaj isteğindeki yazı) */}
        {activeConversation.first_message && (
          <MessageBubble
            message={{
              id: 'first-message',
              conversation_id: activeConversation.id,
              sender_id: activeConversation.initiator_id,
              content: activeConversation.first_message,
              is_read: true,
              created_at: activeConversation.created_at,
            }}
            isOwn={activeConversation.initiator_id === user?.id}
          />
        )}

        {/* Mesajlar */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 safe-bottom">
        <MessageInput onSend={sendMessage} disabled={loading} />
      </div>
    </motion.div>
  )

  return (
    <AnimatePresence>
      {isMobile ? mobilePanel : desktopPanel}
    </AnimatePresence>
  )
}
