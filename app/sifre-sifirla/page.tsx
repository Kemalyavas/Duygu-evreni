'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/fetch'

export default function PasswordResetPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setIsValidSession(true)
      } else {
        // Try to get session from URL hash (for older Supabase flow)
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          // Parse the hash
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (!error) {
              setIsValidSession(true)
              // Clear hash from URL
              window.history.replaceState(null, '', window.location.pathname)
              return
            }
          }
        }
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black">
        <div className="text-white animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  // Invalid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Geçersiz veya Süresi Dolmuş Link
            </h1>
            <p className="text-white/60 mb-6">
              Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin.
            </p>
            <Link href="/giris">
              <Button variant="primary" className="w-full">
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Şifre Güncellendi!
            </h1>
            <p className="text-white/60">
              Yönlendiriliyorsunuz...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Yeni Şifre Belirle
          </h1>
          <p className="text-white/60 text-center mb-8">
            Hesabın için yeni bir şifre oluştur
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Yeni Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
            />

            <Input
              label="Şifre Tekrar"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              required
              minLength={6}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
            >
              Şifreyi Güncelle
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
