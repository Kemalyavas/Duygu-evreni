'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// Personal favorites live ONLY on the device (localStorage) — no auth, no DB,
// keeps the product anonymous-first. The public "resonance" count is bumped once
// per device (separate set) on the FIRST time a star is favorited.
const FAV_KEY = 'duygu-evreni-favorites'
const RES_KEY = 'duygu-evreni-resonated'

function loadSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore localStorage errors
  }
  return new Set()
}

function saveSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // ignore localStorage errors
  }
}

// Read helper for components that just need the current id list at a point in
// time (e.g. the favorites panel reading fresh ids every time it opens).
export function readFavoriteIds(): string[] {
  return [...loadSet(FAV_KEY)]
}

export function useFavorites() {
  // favoriteIds drives reactive UI. favRef mirrors it as the synchronous source
  // of truth for toggle decisions — only read inside handlers, never during render.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => loadSet(FAV_KEY))
  const favRef = useRef<Set<string>>(favoriteIds)
  const resonatedRef = useRef<Set<string>>(loadSet(RES_KEY))

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds])
  const hasResonated = useCallback((id: string) => resonatedRef.current.has(id), [])

  // Toggle the personal favorite. On the FIRST favorite of a star on this device,
  // also fire the anonymous resonance increment (one-way; un-favoriting never
  // decrements). Returns whether it is now a favorite and whether it resonated,
  // so the caller can optimistically bump its displayed count.
  const toggleFavorite = useCallback(
    async (id: string): Promise<{ favorite: boolean; resonated: boolean }> => {
      const wasFavorite = favRef.current.has(id)
      const next = new Set(favRef.current)
      if (wasFavorite) {
        next.delete(id)
      } else {
        next.add(id)
      }
      favRef.current = next
      saveSet(FAV_KEY, next)
      setFavoriteIds(next)

      const nowFavorite = !wasFavorite
      let resonated = false

      if (nowFavorite && !resonatedRef.current.has(id)) {
        // Mark locally FIRST so a failed/duplicate call never double-counts.
        resonatedRef.current.add(id)
        saveSet(RES_KEY, resonatedRef.current)
        resonated = true
        try {
          const supabase = createClient()
          await supabase.rpc('increment_star_resonance', { p_star_id: id })
        } catch {
          // best-effort; the local flag stays set so we don't retry/spam
        }
      }

      return { favorite: nowFavorite, resonated }
    },
    []
  )

  return { favoriteIds, isFavorite, hasResonated, toggleFavorite }
}
