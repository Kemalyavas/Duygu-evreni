'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Button } from './Button'
import { useAuth } from '@/lib/hooks'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLoading, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/profil', label: 'Profil' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0 group">
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
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!isLoading && user && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}

            {isLoading ? (
              <div className="w-20 h-8 bg-white/10 rounded-lg animate-pulse" />
            ) : user ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            ) : (
              <Link href="/giris">
                <Button variant="primary" size="sm">
                  Giriş Yap
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              {!isLoading && user && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {isLoading ? (
                <div className="w-full h-10 bg-white/10 rounded-lg animate-pulse" />
              ) : user ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Çıkış Yap
                </button>
              ) : (
                <Link
                  href="/giris"
                  className="block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
