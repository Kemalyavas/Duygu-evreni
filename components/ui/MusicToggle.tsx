'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMusic } from '@/components/MusicProvider'

export function MusicToggle() {
  const { musicEnabled, toggleMusic, isLoaded } = useMusic()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show consistent UI on server and first client render
  if (!mounted) {
    return (
      <div className="p-2.5 rounded-full backdrop-blur-md border bg-white/5 border-white/10 w-10 h-10" />
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={toggleMusic}
      disabled={!isLoaded}
      className={`
        p-2.5 rounded-full backdrop-blur-md border transition-all duration-300
        ${musicEnabled
          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
        }
        ${!isLoaded ? 'opacity-50 cursor-wait' : 'hover:scale-110'}
      `}
      title={musicEnabled ? 'Müziği Kapat' : 'Müziği Aç'}
      aria-label={musicEnabled ? 'Müziği Kapat' : 'Müziği Aç'}
    >
      {musicEnabled ? (
        // Sound on icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
          <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
        </svg>
      ) : (
        // Sound off icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
        </svg>
      )}
    </motion.button>
  )
}
