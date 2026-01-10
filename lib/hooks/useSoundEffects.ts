'use client'

import { useRef, useCallback, useEffect } from 'react'

const SOUNDS = {
  planetClick: '/sounds/planet_click.mp3',
  starClick: '/sounds/star_click.mp3',
  addStar: '/sounds/add_star.mp3',
} as const

type SoundType = keyof typeof SOUNDS

const VOLUME = {
  planetClick: 0.55,
  starClick: 0.4,
  addStar: 0.4,
} as const

export function useSoundEffects() {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    planetClick: null,
    starClick: null,
    addStar: null,
  })

  // Preload sounds
  useEffect(() => {
    if (typeof window === 'undefined') return

    Object.entries(SOUNDS).forEach(([key, path]) => {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = VOLUME[key as SoundType]
      audioRefs.current[key as SoundType] = audio
    })

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.src = ''
        }
      })
    }
  }, [])

  const playSound = useCallback((type: SoundType) => {
    const audio = audioRefs.current[type]
    if (audio) {
      // Reset to start if already playing
      audio.currentTime = 0
      audio.play().catch(() => {
        // Autoplay might be blocked, that's ok
      })
    }
  }, [])

  const playPlanetClick = useCallback(() => {
    playSound('planetClick')
  }, [playSound])

  const playStarClick = useCallback(() => {
    playSound('starClick')
  }, [playSound])

  const playAddStar = useCallback(() => {
    playSound('addStar')
  }, [playSound])

  return {
    playPlanetClick,
    playStarClick,
    playAddStar,
    playSound,
  }
}
