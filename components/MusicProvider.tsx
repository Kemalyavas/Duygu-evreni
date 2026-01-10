'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'

const STORAGE_KEY = 'duygu-evreni-music-enabled'
const MUSIC_PATH = '/sounds/Universe_Background.mp3'
const DEFAULT_VOLUME = 0.1 // Lowered from 0.15

interface MusicContextType {
  isPlaying: boolean
  isLoaded: boolean
  musicEnabled: boolean
  toggleMusic: () => void
  setVolume: (volume: number) => void
}

const MusicContext = createContext<MusicContextType | null>(null)

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const hasTriedAutoplay = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Check if user previously disabled music (default: enabled)
  const [musicEnabled, setMusicEnabled] = useState(true)

  // Load preference from localStorage after mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setMusicEnabled(stored === 'true')
    }
  }, [])

  // Initialize audio element once globally
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (audioRef.current) return // Already initialized

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

    // Cleanup only on full unmount (app close)
    return () => {
      // Don't cleanup - we want to persist across page navigations
    }
  }, [])

  // Try to play on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mounted) return
    if (!musicEnabled) return

    const tryPlay = () => {
      if (hasTriedAutoplay.current) return
      hasTriedAutoplay.current = true

      if (audioRef.current && musicEnabled) {
        audioRef.current.play().catch(() => {
          // Autoplay blocked, that's ok
        })
      }
    }

    window.addEventListener('click', tryPlay, { once: true })
    window.addEventListener('touchstart', tryPlay, { once: true })
    window.addEventListener('keydown', tryPlay, { once: true })

    return () => {
      window.removeEventListener('click', tryPlay)
      window.removeEventListener('touchstart', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
  }, [musicEnabled, mounted])

  // Handle music enabled state changes
  useEffect(() => {
    if (!mounted) return
    if (!audioRef.current) return

    if (musicEnabled && hasTriedAutoplay.current) {
      audioRef.current.play().catch(() => {})
    } else if (!musicEnabled) {
      audioRef.current.pause()
    }
  }, [musicEnabled, mounted])

  // Toggle music
  const toggleMusic = useCallback(() => {
    const newState = !musicEnabled
    setMusicEnabled(newState)
    localStorage.setItem(STORAGE_KEY, String(newState))

    if (audioRef.current) {
      if (newState) {
        hasTriedAutoplay.current = true
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

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        isLoaded,
        musicEnabled,
        toggleMusic,
        setVolume,
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider')
  }
  return context
}
