'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal, Button } from '@/components/ui'
import { useDailyLimit, useStars, useAuth, generateOrbitPosition } from '@/lib/hooks'
import { moderateContent } from '@/lib/moderation'
import type { Planet, Star } from '@/types'

// Popüler emojiler
const EMOJI_LIST = [
  '😊', '😢', '😡', '😱', '🥰', '😔', '😌', '🤗',
  '💔', '❤️', '💕', '✨', '🌟', '💫', '🔥', '💪',
  '🙏', '🤔', '😴', '🥺', '😭', '🤯', '😤', '🫠',
  '🌈', '🌙', '☀️', '🌸', '🍀', '🦋', '🕊️', '💭',
]

interface StarCreationModalProps {
  isOpen: boolean
  onClose: () => void
  planet: Planet
  onSuccess?: (star: Star) => void
}

const MAX_CHARS = 280

export function StarCreationModal({
  isOpen,
  onClose,
  planet,
  onSuccess,
}: StarCreationModalProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [helpResources, setHelpResources] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { user } = useAuth()
  const { canShareStar, remainingStars, checkRealLimit, incrementStarCount, isAdmin } = useDailyLimit()
  const { createStar } = useStars()

  const isLoggedIn = !!user

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      // Cursor'ı emoji'den sonraya taşı
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent(content + emoji)
    }
    setShowEmojiPicker(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setHelpResources(null)
    setLoading(true)

    try {
      // Check if user is logged in
      if (!isLoggedIn) {
        setError('Yıldız paylaşmak için giriş yapmalısın')
        return
      }

      // Check daily limit from local state first
      if (!canShareStar) {
        setError('Günlük limitine ulaştın. Yarın tekrar dene!')
        return
      }

      // Double-check with database to avoid race conditions
      const hasRealLimit = await checkRealLimit()
      if (!hasRealLimit) {
        setError('Günlük limitine ulaştın. Yarın tekrar dene!')
        return
      }

      // Content moderation
      const moderationResult = await moderateContent(content)

      // Show help resources if provided (even if allowed)
      if (moderationResult.helpResources) {
        setHelpResources(moderationResult.helpResources)
      }

      if (!moderationResult.allowed) {
        setError(moderationResult.reason || 'İçerik uygun değil')
        return
      }

      // Generate random orbit position
      const [position_x, position_y, position_z] = generateOrbitPosition(planet.scale)

      // Create star
      const newStar = await createStar({
        planet_id: planet.id,
        content: content.trim(),
        position_x,
        position_y,
        position_z,
      })

      // Star created successfully - counter is already incremented by database trigger
      if (newStar) {
        setContent('')
        onSuccess?.(newStar)
        onClose()
      } else {
        setError('Yıldız oluşturulamadı, lütfen tekrar dene')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yıldız oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const charsRemaining = MAX_CHARS - content.length
  const isOverLimit = charsRemaining < 0

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Planet header */}
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}80)`,
              boxShadow: `0 0 20px ${planet.color}40`,
            }}
          />
          <div>
            <h2 className="text-xl font-bold text-white">{planet.name_tr}</h2>
            <p className="text-sm text-white/60">{planet.description_tr}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Duygunu buraya yaz..."
              className="w-full h-32 px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              maxLength={MAX_CHARS + 10}
              disabled={!isLoggedIn || !canShareStar}
            />

            {/* Emoji button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!isLoggedIn || !canShareStar}
              className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                isLoggedIn && canShareStar
                  ? 'hover:bg-white/10 text-white/50 hover:text-white/80'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              title="Emoji ekle"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-12 right-0 z-10 p-3 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl"
                >
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Character counter */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/40">
                {!isLoggedIn
                  ? 'Yıldız paylaşmak için giriş yap'
                  : isAdmin
                  ? '👑 Admin - Sınırsız yıldız'
                  : remainingStars > 0
                  ? `Bugün ${remainingStars} yıldız paylaşabilirsin`
                  : 'Günlük limitine ulaştın'}
              </span>
              <span
                className={`text-sm ${
                  isOverLimit
                    ? 'text-red-400'
                    : charsRemaining < 30
                    ? 'text-yellow-400'
                    : 'text-white/60'
                }`}
              >
                {charsRemaining}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Help resources (shown for sensitive content) */}
          {helpResources && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
            >
              <p className="text-blue-300 text-sm text-center">
                {helpResources}
              </p>
            </motion.div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={!isLoggedIn || !canShareStar || isOverLimit || content.trim().length === 0}
          >
            {!isLoggedIn ? 'Giriş Yap' : canShareStar ? 'Yıldızı Gönder' : 'Limit Doldu'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
