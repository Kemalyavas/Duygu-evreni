'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabaseFetch } from '@/lib/supabase/fetch'
import { readFavoriteIds } from '@/lib/hooks/useFavorites'
import { useTranslation } from '@/lib/i18n'
import type { Star, Planet } from '@/types'

interface FavoritesPanelProps {
  isOpen: boolean
  onClose: () => void
  planets: Planet[]
  onNavigate: (planetId: string, starId: string) => void
}

type Tab = 'favorites' | 'featured'

export function FavoritesPanel({ isOpen, onClose, planets, onNavigate }: FavoritesPanelProps) {
  const { t, language } = useTranslation()
  const [tab, setTab] = useState<Tab>('favorites')
  const [favStars, setFavStars] = useState<Star[] | null>(null)
  const [topStars, setTopStars] = useState<Star[] | null>(null)

  const planetById = useCallback(
    (id: string) => planets.find((p) => p.id === id),
    [planets]
  )
  const planetName = useCallback(
    (p?: Planet) => (!p ? '' : language === 'en' ? p.name_en || p.name_tr : p.name_tr),
    [language]
  )

  // Favorites: read fresh ids from localStorage every time the tab opens, then
  // fetch those stars by id (they may live on planets not currently loaded).
  useEffect(() => {
    if (!isOpen || tab !== 'favorites') return
    const ids = readFavoriteIds()
    if (ids.length === 0) {
      setFavStars([])
      return
    }
    let active = true
    setFavStars(null)
    ;(async () => {
      const { data } = await supabaseFetch<Star[]>('stars', {
        filter: `id=in.(${ids.join(',')})`,
      })
      if (!active) return
      // Preserve the user's save order (most-recently saved first).
      const order = new Map(ids.map((id, i) => [id, i]))
      const sorted = (data || []).slice().sort(
        (a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0)
      )
      setFavStars(sorted)
    })()
    return () => {
      active = false
    }
  }, [isOpen, tab])

  // Featured: most-resonant stars (resonance_count > 0, desc).
  useEffect(() => {
    if (!isOpen || tab !== 'featured') return
    let active = true
    setTopStars(null)
    ;(async () => {
      const { data } = await supabaseFetch<Star[]>('stars', {
        filter: `resonance_count=gt.0`,
        order: 'resonance_count.desc',
        limit: 30,
      })
      if (active) setTopStars(data || [])
    })()
    return () => {
      active = false
    }
  }, [isOpen, tab])

  const list = tab === 'favorites' ? favStars : topStars
  const emptyText = tab === 'favorites' ? t('favorites.empty') : t('favorites.emptyFeatured')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[80vh] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d1a]/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-lg font-bold text-white">{t('favorites.title')}</h2>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 px-5">
              {(['favorites', 'featured'] as Tab[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    tab === key ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {key === 'favorites' ? t('favorites.myFavorites') : t('favorites.featured')}
                  {tab === key && (
                    <motion.div
                      layoutId="favTabUnderline"
                      className="absolute inset-0 -z-10 rounded-xl border border-white/10 bg-white/10"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
              {list === null ? (
                <div className="flex h-32 items-center justify-center text-sm text-white/40">
                  {t('favorites.loading')}
                </div>
              ) : list.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="text-3xl">✨</span>
                  <p className="text-sm leading-relaxed text-white/50">{emptyText}</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {list.map((star) => {
                    const planet = planetById(star.planet_id)
                    const color = planet?.color || '#8b5cf6'
                    return (
                      <li key={star.id}>
                        <button
                          onClick={() => onNavigate(star.planet_id, star.id)}
                          className="group flex w-full items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.07]"
                        >
                          {/* Emotion orb */}
                          <span
                            className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: color, boxShadow: `0 0 10px 1px ${color}99` }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold" style={{ color }}>
                                {planetName(planet)}
                              </span>
                              {(star.resonance_count ?? 0) > 0 && (
                                <span className="flex shrink-0 items-center gap-1 text-xs text-white/40">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="#ff4d6d" stroke="#ff4d6d" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {star.resonance_count}
                                </span>
                              )}
                            </span>
                            <span className="mt-1 line-clamp-2 block text-sm text-white/80">
                              {star.content}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
