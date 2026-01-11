'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store/useStore'
import { useMessages, useAuth, useMobile } from '@/lib/hooks'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

export function ChatPanel() {
  const { user } = useAuth()
  const isMobile = useMobile()
  const { activeConversation, isMessagingPanelOpen, setMessagingPanelOpen, setActiveConversation } = useStore()
  const { messages, sendMessage, loading, markAsRead } = useMessages(activeConversation?.id || null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when opened
  useEffect(() => {
    if (isMessagingPanelOpen && activeConversation) {
      markAsRead()
    }
  }, [isMessagingPanelOpen, activeConversation, markAsRead])

  const handleClose = () => {
    setMessagingPanelOpen(false)
    setActiveConversation(null)
  }

  if (!isMessagingPanelOpen || !activeConversation) return null

  // Karşı tarafın bilgisi
  const otherUser = activeConversation.initiator_id === user?.id
    ? activeConversation.star_owner
    : activeConversation.initiator
  const otherUsername = otherUser?.username || 'Anonim'

  // Desktop panel
  const desktopPanel = (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="hidden md:flex fixed right-0 top-0 bottom-0 w-[400px] bg-[#0d0d1a]/95 backdrop-blur-xl border-l border-white/10 z-40 flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
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
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* İlk mesaj (kabul edilen istek) */}
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">Sohbet başladı</p>
        </div>

        {/* Mesajlar */}
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">Henüz mesaj yok</p>
            <p className="text-white/30 text-xs mt-1">İlk mesajı sen gönder!</p>
          </div>
        )}

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
      <MessageInput onSend={sendMessage} disabled={loading} />
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 safe-top">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">Sohbet başladı</p>
        </div>

        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">Henüz mesaj yok</p>
            <p className="text-white/30 text-xs mt-1">İlk mesajı sen gönder!</p>
          </div>
        )}

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
      <div className="safe-bottom">
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
