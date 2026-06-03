'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { useMessages, useAuth, useMobile, useBlocking, useNicknames } from '@/lib/hooks'
import { useTranslation } from '@/lib/i18n'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ReportModal } from './ReportModal'
import { NicknameModal } from './NicknameModal'

// Hook to handle mobile keyboard height
function useKeyboardHeight(enabled: boolean) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      // Calculate keyboard height from viewport difference
      const newKeyboardHeight = window.innerHeight - viewport.height
      setKeyboardHeight(Math.max(0, newKeyboardHeight))

      // Also set CSS variable for use in styles
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${Math.max(0, newKeyboardHeight)}px`
      )
    }

    // Initial check
    handleResize()

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
      document.documentElement.style.setProperty('--keyboard-height', '0px')
    }
  }, [enabled])

  return keyboardHeight
}

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
  returnText,
}: {
  username: string
  unreadCount: number
  onClick: () => void
  returnText: string
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
          <p className="text-white/40 text-xs">{returnText}</p>
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
  const { t } = useTranslation()
  const isMobile = useMobile()
  const keyboardHeight = useKeyboardHeight(isMobile)
  const [hasMounted, setHasMounted] = useState(false)
  const {
    activeConversation,
    isMessagingPanelOpen,
    setMessagingPanelOpen,
    setActiveConversation,
    isChatCompact,
    setChatCompact,
  } = useStore(
    useShallow((s) => ({
      activeConversation: s.activeConversation,
      isMessagingPanelOpen: s.isMessagingPanelOpen,
      setMessagingPanelOpen: s.setMessagingPanelOpen,
      setActiveConversation: s.setActiveConversation,
      isChatCompact: s.isChatCompact,
      setChatCompact: s.setChatCompact,
    }))
  )
  const { messages, sendMessage, loading, markAsRead } = useMessages(activeConversation?.id || null)
  const { blockUser, unblockUser, blockedUsers, fetchBlockedUsers } = useBlocking()
  const { nicknames, fetchNicknames, getNickname } = useNicknames()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [unreadInCompact, setUnreadInCompact] = useState(0)

  // Modal states
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [localNickname, setLocalNickname] = useState<string | null>(null)

  // Track mount state to prevent SSR/hydration flash
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Fetch blocked users and nicknames on mount
  useEffect(() => {
    if (user) {
      fetchBlockedUsers()
      fetchNicknames()
    }
  }, [user, fetchBlockedUsers, fetchNicknames])

  // Update local nickname when conversation changes
  useEffect(() => {
    if (activeConversation?.id) {
      const savedNickname = getNickname(activeConversation.id)
      setLocalNickname(savedNickname)
    }
  }, [activeConversation?.id, getNickname, nicknames])

  // Auto-scroll to bottom (also when keyboard opens)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, keyboardHeight])

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

  // Don't render until mounted (prevents SSR/hydration mismatch flash)
  // Also don't render if panel is closed or no conversation
  if (!hasMounted || !isMessagingPanelOpen || !activeConversation) return null

  // Karşı tarafın bilgisi
  const otherUser = activeConversation.initiator_id === user?.id
    ? activeConversation.star_owner
    : activeConversation.initiator

  const otherUserId = otherUser?.id

  // A conversation is writable only once accepted. Until then show a status
  // notice instead of the message input — the DB RLS also rejects messages to
  // non-accepted conversations, so an input here would just fail silently.
  const isPendingConversation = activeConversation.status !== 'accepted'
  const isConversationInitiator = activeConversation.initiator_id === user?.id
  const pendingNotice = (
    <div className="p-4 border-t border-white/10 bg-white/5">
      <p className="text-white/60 text-sm text-center">
        {isConversationInitiator ? t('chat.waitingAcceptance') : t('chat.pendingRequestHint')}
      </p>
    </div>
  )

  // Check if other user is blocked
  const isOtherUserBlocked = otherUserId
    ? blockedUsers.some(b => b.blocked_id === otherUserId)
    : false

  // Respect privacy setting: show username only if show_username_in_chats is true
  const otherUsername = (otherUser?.show_username_in_chats !== false && otherUser?.username)
    ? otherUser.username
    : t('common.anonymous')

  // Display name: nickname > username > anonymous
  const displayName = localNickname || otherUsername

  // Handle block/unblock
  const handleBlock = async () => {
    if (!otherUserId) return
    try {
      await blockUser(otherUserId)
      setIsMenuOpen(false)
    } catch {
      // Error handled in hook
    }
  }

  const handleUnblock = async () => {
    if (!otherUserId) return
    try {
      await unblockUser(otherUserId)
      setIsMenuOpen(false)
    } catch {
      // Error handled in hook
    }
  }

  // Show compact button when minimized (desktop only)
  if (isChatCompact && !isMobile) {
    return (
      <AnimatePresence>
        <CompactChatButton
          username={otherUsername}
          unreadCount={unreadInCompact}
          onClick={handleExpand}
          returnText={t('chat.returnToChat')}
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
      <div className="relative z-30 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <span className="text-white/80 text-sm font-medium">
                {displayName[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <button
                onClick={() => setIsNicknameModalOpen(true)}
                className="text-white font-medium hover:text-cyan-400 transition-colors text-left"
              >
                {displayName}
                {localNickname && (
                  <span className="text-white/30 text-xs ml-1">({otherUsername})</span>
                )}
              </button>
              <p className="text-white/40 text-xs">{t('chat.title')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Menu button */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {/* Dropdown menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#0d0d1a] border border-white/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <button
                      onClick={() => { setIsNicknameModalOpen(true); setIsMenuOpen(false); }}
                      className="w-full px-4 py-3 text-left text-white/80 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {t('menu.setNickname')}
                    </button>
                    {isOtherUserBlocked ? (
                      <button
                        onClick={handleUnblock}
                        className="w-full px-4 py-3 text-left text-green-400 hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        {t('menu.unblock')}
                      </button>
                    ) : (
                      <button
                        onClick={handleBlock}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        {t('menu.block')}
                      </button>
                    )}
                    <button
                      onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}
                      className="w-full px-4 py-3 text-left text-orange-400 hover:bg-white/5 transition-colors flex items-center gap-3 border-t border-white/5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {t('menu.report')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Minimize button */}
            <button
              onClick={handleMinimize}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title={t('chat.minimize')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title={t('common.close')}
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
                {t('chat.clickToGoToStar')}
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
        {/* Chat started */}
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">{t('chat.chatStarted')}</p>
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

      {/* Input or Blocked Banner */}
      <div className="relative z-10">
        {isOtherUserBlocked ? (
          <div className="p-4 border-t border-white/10 bg-red-500/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-white/70 text-sm">{t('chat.userBlocked')}</p>
              <button
                onClick={handleUnblock}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                {t('menu.unblock')}
              </button>
            </div>
          </div>
        ) : isPendingConversation ? (
          pendingNotice
        ) : (
          <MessageInput onSend={sendMessage} disabled={loading} />
        )}
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
      className="md:hidden fixed inset-x-0 top-0 bg-[#0d0d1a]/98 backdrop-blur-xl z-50 flex flex-col"
      style={{
        height: keyboardHeight > 0
          ? `calc(100dvh - ${keyboardHeight}px)`
          : '100dvh',
        // Prevent iOS bounce/overscroll
        overscrollBehavior: 'none',
      }}
    >
      {/* Floating stars background */}
      <FloatingStars />

      {/* Header */}
      <div className="relative z-30 border-b border-white/10 safe-top">
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
                {displayName[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <button
              onClick={() => setIsNicknameModalOpen(true)}
              className="text-white font-medium hover:text-cyan-400 transition-colors"
            >
              {displayName}
            </button>
          </div>
          {/* Mobile menu button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {/* Mobile dropdown menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-[#0d0d1a] border border-white/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <button
                    onClick={() => { setIsNicknameModalOpen(true); setIsMenuOpen(false); }}
                    className="w-full px-4 py-3 text-left text-white/80 hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {t('menu.setNickname')}
                  </button>
                  {isOtherUserBlocked ? (
                    <button
                      onClick={handleUnblock}
                      className="w-full px-4 py-3 text-left text-green-400 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      {t('menu.unblock')}
                    </button>
                  ) : (
                    <button
                      onClick={handleBlock}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      {t('menu.block')}
                    </button>
                  )}
                  <button
                    onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}
                    className="w-full px-4 py-3 text-left text-orange-400 hover:bg-white/5 transition-colors flex items-center gap-3 border-t border-white/5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t('menu.report')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
                {t('chat.tapToGoToStar')}
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 overscroll-none"
        style={{
          // Add extra padding at bottom for safe area when keyboard is closed
          paddingBottom: keyboardHeight === 0 ? 'calc(1rem + var(--safe-area-bottom))' : '1rem',
        }}
      >
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">{t('chat.chatStarted')}</p>
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

      {/* Input or Blocked Banner - safe-bottom only when keyboard is closed */}
      <div
        className="relative z-10"
        style={{
          paddingBottom: keyboardHeight === 0 ? 'var(--safe-area-bottom)' : 0,
        }}
      >
        {isOtherUserBlocked ? (
          <div className="p-4 border-t border-white/10 bg-red-500/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-white/70 text-sm">{t('chat.userBlocked')}</p>
              <button
                onClick={handleUnblock}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                {t('menu.unblock')}
              </button>
            </div>
          </div>
        ) : isPendingConversation ? (
          pendingNotice
        ) : (
          <MessageInput onSend={sendMessage} disabled={loading} />
        )}
      </div>
    </motion.div>
  )

  return (
    <>
      <AnimatePresence>
        {isMobile ? mobilePanel : desktopPanel}
      </AnimatePresence>

      {/* Modals */}
      {otherUserId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          userId={otherUserId}
          conversationId={activeConversation?.id}
        />
      )}

      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        conversationId={activeConversation?.id || ''}
        currentNickname={localNickname}
        onNicknameChange={(nickname) => {
          setLocalNickname(nickname)
          fetchNicknames()
        }}
      />
    </>
  )
}
