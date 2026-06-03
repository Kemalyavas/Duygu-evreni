'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// Personal favorites live on the device (localStorage). The heart is a fully
// REVERSIBLE toggle: turning it ON contributes +1 to the star's public
// "resonance" count (Öne Çıkanlar); turning it OFF removes that contribution
// (-1). favoriteIds IS the on/off state, so the heart and the count stay in sync
// (un-hearting removes the star from "Öne Çıkanlar" once the count hits 0).
const FAV_KEY = 'duygu-evreni-favorites'

function loadSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore localStorage errors
  }
  return new Set()
}

function saveSet(set: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...set]))
  } catch {
    // ignore localStorage errors
  }
}

// Read helper for components that just need the current id list at a point in
// time (e.g. the favorites panel reading fresh ids every time it opens).
export function readFavoriteIds(): string[] {
  return [...loadSet()]
}

export function useFavorites() {
  // favoriteIds drives reactive UI. favRef mirrors it as the synchronous source
  // of truth for toggle decisions (read only inside the handler, never in render).
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => loadSet())
  const favRef = useRef<Set<string>>(favoriteIds)

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds])

  // Reversible toggle. Returns the new favorite state and the resonance delta
  // (+1 turned on, -1 turned off) so the caller can update its count optimistically.
  const toggleFavorite = useCallback(
    async (id: string): Promise<{ favorite: boolean; delta: number }> => {
      const wasFavorite = favRef.current.has(id)
      const next = new Set(favRef.current)
      if (wasFavorite) {
        next.delete(id)
      } else {
        next.add(id)
      }
      favRef.current = next
      saveSet(next)
      setFavoriteIds(next)

      const nowFavorite = !wasFavorite
      const delta = nowFavorite ? 1 : -1
      try {
        const supabase = createClient()
        await supabase.rpc(
          nowFavorite ? 'increment_star_resonance' : 'decrement_star_resonance',
          { p_star_id: id }
        )
      } catch {
        // best-effort; local state already reflects the user's intent
      }

      return { favorite: nowFavorite, delta }
    },
    []
  )

  return { favoriteIds, isFavorite, toggleFavorite }
}
