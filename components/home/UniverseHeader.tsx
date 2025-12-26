'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

interface UniverseHeaderProps {
  isInPlanetMode: boolean
  onBackToUniverse: () => void
  user: { id: string; email?: string } | null
  authLoading: boolean
  onLogout: () => void
}

/**
 * Header component with logo and auth buttons
 */
export function UniverseHeader({
  isInPlanetMode,
  onBackToUniverse,
  user,
  authLoading,
  onLogout,
}: UniverseHeaderProps) {
  return (
    <>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-4 z-20"
      >
        <button
          onClick={isInPlanetMode ? onBackToUniverse : undefined}
          className="flex items-center gap-0 group cursor-pointer"
        >
          <Image
            src="/logo.png"
            alt="Duygu Evreni"
            width={75}
            height={75}
            className="w-[75px] h-[75px]"
          />
          <span className="font-bold text-[17px] -ml-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            Duygu Evreni
          </span>
        </button>
      </motion.div>

      {/* Auth Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6 z-20 flex items-center space-x-4"
      >
        {authLoading ? (
          <div className="w-20 h-8 bg-white/10 rounded-lg animate-pulse" />
        ) : user ? (
          <>
            <Link
              href="/profil"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Profil
            </Link>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Çıkış Yap
            </Button>
          </>
        ) : (
          <Link href="/giris">
            <Button variant="primary" size="sm">
              Giriş Yap
            </Button>
          </Link>
        )}
      </motion.div>
    </>
  )
}
