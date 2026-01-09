'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'duygu-evreni-read-stars'

export function useReadStars() {
  // Lazy initialize from localStorage
  const [readStarIds, setReadStarIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const ids = JSON.parse(stored) as string[]
        return new Set(ids)
      }
    } catch {
      // Ignore localStorage errors
    }
    return new Set()
  })

  // Mark a star as read
  const markAsRead = useCallback((starId: string) => {
    setReadStarIds((prev) => {
      const newSet = new Set(prev)
      newSet.add(starId)

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet]))
      } catch {
        // Ignore localStorage errors
      }

      return newSet
    })
  }, [])

  // Check if a star is read
  const isRead = useCallback((starId: string) => {
    return readStarIds.has(starId)
  }, [readStarIds])

  return {
    readStarIds,
    markAsRead,
    isRead,
  }
}
