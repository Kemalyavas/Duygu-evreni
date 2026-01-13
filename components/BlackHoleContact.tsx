'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BLACK_HOLE_SOUND = '/sounds/black_hole.mp3'

const CONTACT_INFO = {
  name: 'Ali Kemal Yavas',
  bio: 'Bu evreni yarattim',
  email: 'kemalyavaass@gmail.com',
  instagram: 'https://instagram.com/kemalyavaas/',
}

export function BlackHoleContact() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Preload sound
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio(BLACK_HOLE_SOUND)
    audio.preload = 'auto'
    audio.volume = 0.6
    audioRef.current = audio

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)

    // Play sound only when opening
    if (newState && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }

    // Scroll to black hole while it opens
    if (newState && containerRef.current) {
      // Use requestAnimationFrame for smooth following
      let frame: number
      const startTime = performance.now()
      const duration = 600

      const animate = () => {
        const elapsed = performance.now() - startTime

        if (elapsed < duration) {
          containerRef.current?.scrollIntoView({ block: 'end', behavior: 'instant' })
          frame = requestAnimationFrame(animate)
        }
      }

      frame = requestAnimationFrame(animate)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-3 mt-8 pb-8"
    >
      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white/20 text-xs"
      >
        Kara delige dokun
      </motion.p>

      {/* Black Hole Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring - always visible, pulses */}
        <motion.div
          className="absolute rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          }}
          animate={{
            width: isOpen ? 320 : 40,
            height: isOpen ? 320 : 40,
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            width: { duration: 0.5, ease: 'easeOut' },
            height: { duration: 0.5, ease: 'easeOut' },
            opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Swirl effect - visible on hover/open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.3 },
                scale: { duration: 0.5, ease: 'easeOut' },
              }}
              className="absolute w-72 h-72 rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, transparent, rgba(139,92,246,0.1), transparent, rgba(59,130,246,0.1), transparent)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Main black hole button */}
        <motion.button
          onClick={handleToggle}
          className="relative z-10 rounded-full bg-black border border-white/10 cursor-pointer"
          style={{
            boxShadow: isOpen
              ? '0 0 60px rgba(139,92,246,0.4), 0 0 100px rgba(59,130,246,0.2), inset 0 0 30px rgba(0,0,0,0.8)'
              : '0 0 20px rgba(139,92,246,0.3), inset 0 0 10px rgba(0,0,0,0.5)',
          }}
          animate={{
            width: isOpen ? 260 : 20,
            height: isOpen ? 260 : 20,
          }}
          whileHover={!isOpen ? {
            width: 28,
            height: 28,
            boxShadow: '0 0 30px rgba(139,92,246,0.5), inset 0 0 15px rgba(0,0,0,0.5)',
          } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Content inside the black hole */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6"
              >
                {/* Name */}
                <motion.h3
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white font-semibold text-lg mb-1"
                >
                  {CONTACT_INFO.name}
                </motion.h3>

                {/* Bio */}
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/50 text-sm mb-6 italic"
                >
                  &quot;{CONTACT_INFO.bio}&quot;
                </motion.p>

                {/* Contact buttons */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-4"
                >
                  {/* Email */}
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all group"
                  >
                    <svg
                      className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-white/70 text-sm group-hover:text-white transition-colors">Mail</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href={CONTACT_INFO.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 transition-all group"
                  >
                    <svg
                      className="w-4 h-4 text-pink-400 group-hover:text-pink-300 transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-white/70 text-sm group-hover:text-white transition-colors">Instagram</span>
                  </a>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Event horizon ring */}
        <motion.div
          className="absolute rounded-full border pointer-events-none"
          style={{
            borderColor: 'rgba(139,92,246,0.3)',
          }}
          animate={{
            width: isOpen ? 270 : 26,
            height: isOpen ? 270 : 26,
            borderWidth: isOpen ? 1 : 1,
            opacity: isOpen ? 0.5 : 0.3,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
