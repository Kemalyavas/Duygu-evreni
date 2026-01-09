'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'duygu-evreni-music-enabled'
const MUSIC_PATH = '/sounds/Universe_Background.mp3'
const DEFAULT_VOLUME = 0.3

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const hasTriedAutoplay = useRef(false)

  // Check if user previously disabled music (default: enabled)
  const [musicEnabled, setMusicEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = new Audio(MUSIC_PATH)
    audio.loop = true
    audio.volume = DEFAULT_VOLUME
    audio.preload = 'auto'

    audio.addEventListener('canplaythrough', () => {
      setIsLoaded(true)
    })

    audio.addEventListener('play', () => {
      setIsPlaying(true)
    })

    audio.addEventListener('pause', () => {
      setIsPlaying(false)
    })

    audio.addEventListener('error', (e) => {
      console.warn('Background music failed to load:', e)
    })

    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  // Try to play on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!musicEnabled) return // Don't autoplay if user disabled it

    const tryPlay = () => {
      if (hasTriedAutoplay.current) return
      hasTriedAutoplay.current = true

      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Autoplay blocked, that's ok - user can click the button
        })
      }
    }

    // Try on any user interaction
    window.addEventListener('click', tryPlay, { once: true })
    window.addEventListener('touchstart', tryPlay, { once: true })
    window.addEventListener('keydown', tryPlay, { once: true })

    return () => {
      window.removeEventListener('click', tryPlay)
      window.removeEventListener('touchstart', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
  }, [musicEnabled])

  // Also try when audio becomes loaded (if user already interacted)
  useEffect(() => {
    if (!isLoaded || !musicEnabled || isPlaying) return
    if (!hasTriedAutoplay.current) return // Wait for user interaction

    audioRef.current?.play().catch(() => {})
  }, [isLoaded, musicEnabled, isPlaying])

  // Toggle music
  const toggleMusic = useCallback(() => {
    const newState = !musicEnabled
    setMusicEnabled(newState)
    localStorage.setItem(STORAGE_KEY, String(newState))

    if (audioRef.current) {
      if (newState) {
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
    }
  }, [musicEnabled])

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
  }, [])

  return {
    isPlaying,
    isLoaded,
    musicEnabled,
    toggleMusic,
    setVolume,
  }
}
