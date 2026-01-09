'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Modal, Button } from '@/components/ui'
import { useDailyLimit, useStars, generateOrbitPosition } from '@/lib/hooks'
import { moderateContent } from '@/lib/moderation'
import type { Planet, Star } from '@/types'

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

  const { canShareStar, remainingStars, incrementStarCount, isAdmin } = useDailyLimit()
  const { createStar } = useStars()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setHelpResources(null)
    setLoading(true)

    try {
      // Check daily limit
      if (!canShareStar) {
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

      // Increment daily limit
      await incrementStarCount()

      // Reset and close
      setContent('')
      if (newStar) {
        onSuccess?.(newStar)
      }
      onClose()
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
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Duygunu buraya yaz..."
              className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              maxLength={MAX_CHARS + 10}
              disabled={!canShareStar}
            />

            {/* Character counter */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/40">
                {isAdmin
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
            disabled={!canShareStar || isOverLimit || content.trim().length === 0}
          >
            {canShareStar ? 'Yıldızı Gönder' : 'Limit Doldu'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
