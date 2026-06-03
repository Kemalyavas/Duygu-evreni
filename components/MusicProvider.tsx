'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'

const STORAGE_KEY = 'duygu-evreni-music-enabled'
const MUSIC_PATH = '/sounds/Universe_Background.mp3'
const DEFAULT_VOLUME = 0.1

// Check if device is mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
}

interface MusicContextType {
  isPlaying: boolean
  isLoaded: boolean
  musicEnabled: boolean
  toggleMusic: () => void
  setVolume: (volume: number) => void
}

const MusicContext = createContext<MusicContextType | null>(null)

// Global audio instance to persist across page navigations
let globalAudio: HTMLAudioElement | null = null
let globalAudioInitialized = false

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const hasTriedAutoplay = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Check if user previously set music preference
  // Default: OFF on mobile, ON on desktop
  const [musicEnabled, setMusicEnabled] = useState(false)

  // Load preference from localStorage after mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      // User has a saved preference, use it
      setMusicEnabled(stored === 'true')
    } else {
      // No saved preference - default OFF on mobile, ON on desktop
      const defaultEnabled = !isMobile()
      setMusicEnabled(defaultEnabled)
    }
  }, [])

  // Initialize audio element once globally
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Use global audio to persist across navigations
    if (globalAudioInitialized && globalAudio) {
      audioRef.current = globalAudio
      setIsLoaded(true)
      setIsPlaying(!globalAudio.paused)
      return
    }

    const audio = new Audio(MUSIC_PATH)
    audio.loop = true
    audio.volume = DEFAULT_VOLUME
    // Desktop (music defaults ON) preloads so the toggle is INSTANT — otherwise
    // clicking it kicks off the full ~20 MB download and the button hangs on a
    // spinner. Mobile (music defaults OFF) skips the download until the user opts in.
    audio.preload = isMobile() ? 'none' : 'auto'

    // Named handlers for proper cleanup
    const handleCanPlayThrough = () => setIsLoaded(true)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = (e: Event) => console.warn('Background music failed to load:', e)

    audio.addEventListener('canplaythrough', handleCanPlayThrough)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    audioRef.current = audio
    globalAudio = audio
    globalAudioInitialized = true

    // Cleanup event listeners on unmount (but keep audio for navigation persistence)
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  // Try to play on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mounted) return
    if (!musicEnabled) return

    const tryPlay = () => {
      if (hasTriedAutoplay.current) return

      if (audioRef.current && musicEnabled) {
        // Mark that we tried, but only if play succeeds
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              hasTriedAutoplay.current = true
            })
            .catch(() => {
              // Autoplay blocked, will try again on next interaction
            })
        }
      }
    }

    // Multiple event types for better mobile support
    const events = ['click', 'touchstart', 'touchend', 'keydown', 'scroll']
    events.forEach(event => {
      window.addEventListener(event, tryPlay, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, tryPlay)
      })
    }
  }, [musicEnabled, mounted])

  // Also try when audio becomes loaded (if user already interacted)
  useEffect(() => {
    if (!isLoaded || !musicEnabled || isPlaying) return
    if (hasTriedAutoplay.current) return

    // User may have interacted before audio was ready, try again
    const timer = setTimeout(() => {
      if (audioRef.current && !hasTriedAutoplay.current) {
        audioRef.current.play()
          .then(() => {
            hasTriedAutoplay.current = true
          })
          .catch(() => {})
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isLoaded, musicEnabled, isPlaying])

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
