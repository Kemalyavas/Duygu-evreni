'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Modal, Button } from '@/components/ui'
import { ShareButtons } from '@/components/ShareButtons'
import { useDailyLimit, useStars, useAuth, generateOrbitPosition } from '@/lib/hooks'
import { useTranslation } from '@/lib/i18n'
import { moderateContent } from '@/lib/moderation'
import { createClient } from '@/lib/supabase/client'
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

// localStorage key for anonymous star tracking
const ANON_STAR_KEY = 'duygu-evreni-anonymous-star'

function hasSharedAnonymousStar(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(ANON_STAR_KEY)
}

function setAnonymousStarShared(starId: string, planetId: string) {
  localStorage.setItem(ANON_STAR_KEY, JSON.stringify({ starId, planetId, ts: Date.now() }))
}

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
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdStar, setCreatedStar] = useState<Star | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { user } = useAuth()
  const { t, language } = useTranslation()
  const { canShareStar, remainingStars, checkRealLimit, isAdmin } = useDailyLimit()
  const { createStar } = useStars()

  const isLoggedIn = !!user
  const planetName = language === 'tr' ? planet.name_tr : (planet.name_en || planet.name_tr)
  const planetDescription = language === 'tr' ? planet.description_tr : (planet.description_en || planet.description_tr)

  // Determine if anonymous user should see register gate
  const shouldShowRegisterGate = !isLoggedIn && hasSharedAnonymousStar()

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent(content + emoji)
    }
    setShowEmojiPicker(false)
  }

  const handleClose = () => {
    setShowSuccess(false)
    setCreatedStar(null)
    setShareUrl('')
    setError('')
    setHelpResources(null)
    onClose()
  }

  // Anonymous star creation (no auth)
  const handleAnonymousSubmit = async () => {
    const [position_x, position_y, position_z] = generateOrbitPosition(planet.scale)

    const response = await fetch('/api/stars/anonymous', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.trim(),
        planet_id: planet.id,
        position_x,
        position_y,
        position_z,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.helpResources) {
        setHelpResources(data.helpResources)
      }
      throw new Error(data.error || t('star.starCreationFailed'))
    }

    // Success!
    const newStar = data.star as Star
    setCreatedStar(newStar)
    setShareUrl(data.shareUrl || `/?planet=${planet.id}&star=${newStar.id}`)
    setAnonymousStarShared(newStar.id, planet.id)
    setContent('')
    setShowSuccess(true)
    onSuccess?.(newStar)
  }

  // Authenticated star creation (existing flow)
  const handleAuthenticatedSubmit = async () => {
    if (!canShareStar) {
      setError(t('star.dailyLimitReached'))
      return
    }

    const hasRealLimit = await checkRealLimit()
    if (!hasRealLimit) {
      setError(t('star.dailyLimitReached'))
      return
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const moderationResult = await moderateContent(content, session?.access_token)

    if (moderationResult.helpResources) {
      setHelpResources(moderationResult.helpResources)
    }

    if (!moderationResult.allowed) {
      setError(moderationResult.reason || t('star.contentNotAllowed'))
      return
    }

    const [position_x, position_y, position_z] = generateOrbitPosition(planet.scale)

    const newStar = await createStar({
      planet_id: planet.id,
      content: content.trim(),
      position_x,
      position_y,
      position_z,
    })

    if (newStar) {
      setContent('')
      onSuccess?.(newStar)
      onClose()
    } else {
      setError(t('star.starCreationFailed'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setHelpResources(null)
    setLoading(true)

    try {
      if (isLoggedIn) {
        await handleAuthenticatedSubmit()
      } else {
        await handleAnonymousSubmit()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('star.starCreationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const charsRemaining = MAX_CHARS - content.length
  const isOverLimit = charsRemaining < 0
  const canType = isLoggedIn ? canShareStar : !shouldShowRegisterGate

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <AnimatePresence mode="wait">
        {/* ============================================ */}
        {/* SUCCESS VIEW (after anonymous first star) */}
        {/* ============================================ */}
        {showSuccess && createdStar ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-center"
          >
            <div className="space-y-3">
              <div className="text-5xl">✨</div>
              <h2 className="text-2xl font-bold text-white">
                {t('star.firstStarSuccess')}
              </h2>
              <p className="text-white/60">
                {t('star.registerToShareMore')}
              </p>
            </div>

            {/* Star preview */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white text-left">{createdStar.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: planet.color }}
                />
                <span className="text-xs text-white/40">{planetName}</span>
              </div>
            </div>

            {helpResources && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm text-center">{helpResources}</p>
              </div>
            )}

            {/* Share buttons */}
            <div className="space-y-3">
              <p className="text-sm text-white/60 font-medium">{t('star.shareYourStar')}</p>
              <ShareButtons url={shareUrl} text={createdStar.content} />
            </div>

            {/* Register CTA */}
            <div className="space-y-2 pt-2">
              <Link href="/kayit" onClick={handleClose}>
                <Button variant="primary" size="lg" className="w-full">
                  {t('star.registerNow')}
                </Button>
              </Link>
              <button
                onClick={handleClose}
                className="text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                {t('star.maybeLater')}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ============================================ */
          /* FORM VIEW (star creation) */
          /* ============================================ */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
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
                <h2 className="text-xl font-bold text-white">{planetName}</h2>
                <p className="text-sm text-white/60">{planetDescription}</p>
              </div>
            </div>

            {/* Register gate for anonymous users who already shared */}
            {shouldShowRegisterGate ? (
              <div className="space-y-4 text-center py-4">
                <div className="text-4xl">🌟</div>
                <p className="text-white/80">{t('star.alreadySharedAnonymous')}</p>
                <Link href="/kayit" onClick={handleClose}>
                  <Button variant="primary" size="lg" className="w-full">
                    {t('star.registerNow')}
                  </Button>
                </Link>
                <Link href="/giris" onClick={handleClose}>
                  <span className="text-sm text-white/40 hover:text-white/60 transition-colors inline-block mt-2">
                    {t('auth.hasAccount')} {t('auth.login')}
                  </span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Textarea */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('star.writeFeeling')}
                    className="w-full h-32 px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    maxLength={MAX_CHARS + 10}
                    disabled={!canType}
                  />

                  {/* Emoji button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={!canType}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                      canType
                        ? 'hover:bg-white/10 text-white/50 hover:text-white/80'
                        : 'text-white/20 cursor-not-allowed'
                    }`}
                    title={t('star.addEmoji')}
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

                  {/* Character counter and status */}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-white/40">
                      {isLoggedIn
                        ? isAdmin
                          ? t('star.adminUnlimited')
                          : remainingStars > 0
                            ? t('star.canShareToday', { count: remainingStars })
                            : t('universe.dailyLimitReached')
                        : null
                      }
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

                {/* Help resources */}
                {helpResources && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
                  >
                    <p className="text-blue-300 text-sm text-center">{helpResources}</p>
                  </motion.div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={loading}
                  disabled={!canType || isOverLimit || content.trim().length === 0}
                >
                  {isLoggedIn
                    ? canShareStar ? t('star.sendStar') : t('star.limitReached')
                    : t('star.sendStar')
                  }
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
