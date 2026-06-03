'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFavorites } from '@/lib/hooks'
import { useTranslation } from '@/lib/i18n'
import type { Star } from '@/types'

// Heart = save (personal favorite, device-local) + resonance count (public).
// One gesture: tapping saves the star AND, the first time on this device,
// increments the public resonance counter.
export function StarHeartButton({ star }: { star: Star }) {
  const { t } = useTranslation()
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(star.id)
  const [count, setCount] = useState<number>(star.resonance_count ?? 0)
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      const { resonated } = await toggleFavorite(star.id)
      if (resonated) setCount((c) => c + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={fav}
      aria-label={fav ? t('favorites.saved') : t('favorites.save')}
      className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10"
    >
      <motion.span
        key={fav ? 'on' : 'off'}
        initial={false}
        animate={{ scale: fav ? [1, 1.35, 1] : 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 transition-colors"
          viewBox="0 0 24 24"
          fill={fav ? '#ff4d6d' : 'none'}
          stroke={fav ? '#ff4d6d' : 'currentColor'}
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </motion.span>
      <span className={fav ? 'text-white' : 'text-white/70'}>
        {count > 0 ? count : t('favorites.save')}
      </span>
    </button>
  )
}
