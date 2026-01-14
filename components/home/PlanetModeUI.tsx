'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { useTranslation } from '@/lib/i18n'
import type { Planet, Star } from '@/types'

interface PlanetModeUIProps {
  isVisible: boolean
  planet: Planet | null
  starCount: number
  remainingStars: number
  hasClickedStar: boolean
  selectedStar: Star | null
  planetStarCount: number
  onBackToUniverse: () => void
  onOpenModal: () => void
}

/**
 * UI shown in planet mode - back button, planet info, share button, hint
 */
export function PlanetModeUI({
  isVisible,
  planet,
  starCount,
  remainingStars,
  hasClickedStar,
  selectedStar,
  planetStarCount,
  onBackToUniverse,
  onOpenModal,
}: PlanetModeUIProps) {
  const { t, language } = useTranslation()

  if (!isVisible || !planet) return null

  const planetName = language === 'tr' ? planet.name_tr : (planet.name_en || planet.name_tr)
  const planetDescription = language === 'tr' ? planet.description_tr : (planet.description_en || planet.description_tr)

  return (
    <AnimatePresence>
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        onClick={onBackToUniverse}
        className="absolute top-24 left-4 z-20 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 group-hover:-translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>{t('universe.backToUniverse')}</span>
      </motion.button>

      {/* Planet info */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: 0.2 }}
        className="absolute top-36 left-4 md:left-6 z-10"
      >
        <div className="glass rounded-xl p-4 max-w-xs">
          <h1
            className="text-xl font-bold mb-2"
            style={{ color: planet.color }}
          >
            {planetName}
          </h1>
          <p className="text-sm text-white/60">{planetDescription}</p>
          <p className="text-xs text-white/40 mt-2">
            {starCount} {language === 'tr' ? 'yıldız' : 'stars'}
          </p>
        </div>
      </motion.div>

      {/* Share star button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={onOpenModal}
          className="shadow-lg shadow-purple-500/25"
        >
          {t('universe.shareStar')} ({remainingStars} {t('universe.starsRemaining')})
        </Button>
      </motion.div>

      {/* Hint prompt - only shows until user clicks their first star */}
      {!hasClickedStar && !selectedStar && planetStarCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 glass rounded-xl p-4 hidden md:block max-w-xs z-10"
        >
          <p className="text-sm text-white/60 text-center">
            {t('universe.clickStarHint')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
