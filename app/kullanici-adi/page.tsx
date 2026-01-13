'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/client'

export default function KullaniciAdiPage() {
  const router = useRouter()
  const { user, profile, setProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  // Redirect if already has username
  useEffect(() => {
    if (profile?.username) {
      router.replace('/')
    }
  }, [profile, router])

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      router.replace('/giris')
    }
  }, [user, loading, router])

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setChecking(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username)
          .maybeSingle()

        setIsAvailable(!data)
      } catch {
        setIsAvailable(null)
      } finally {
        setChecking(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) {
      return 'Kullanıcı adı en az 3 karakter olmalı'
    }
    if (value.length > 20) {
      return 'Kullanıcı adı en fazla 20 karakter olabilir'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Sadece harf, rakam ve alt çizgi kullanabilirsin'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!isAvailable) {
      setError('Bu kullanıcı adı zaten alınmış')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username, show_username_in_chats: true })
        .eq('id', user!.id)

      if (updateError) {
        if (updateError.message.includes('unique') || updateError.code === '23505') {
          setError('Bu kullanıcı adı zaten alınmış')
        } else {
          setError('Bir hata oluştu, tekrar dene')
        }
        return
      }

      // Update local profile
      if (profile) {
        setProfile({ ...profile, username, show_username_in_chats: true })
      }

      // Redirect to main page
      router.replace('/')
    } catch {
      setError('Bir hata oluştu, tekrar dene')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black flex items-center justify-center">
        <p className="text-white/60 animate-pulse">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Hoş Geldin!
          </h1>
          <p className="text-white/60 text-sm">
            Evrende seni tanıyabilmemiz için bir kullanıcı adı belirle
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-white/60 text-sm mb-2">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  setError(null)
                }}
                placeholder="kullanici_adi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-9 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                maxLength={20}
                autoFocus
              />
              {/* Availability indicator */}
              {username.length >= 3 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checking ? (
                    <svg className="w-5 h-5 text-white/40 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isAvailable ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isAvailable === false ? (
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </span>
              )}
            </div>
            {/* Helper text */}
            <p className="text-white/40 text-xs mt-2">
              3-20 karakter, sadece harf, rakam ve alt çizgi
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          {/* Availability message */}
          {username.length >= 3 && !checking && isAvailable === false && !error && (
            <p className="text-red-400 text-sm">
              Bu kullanıcı adı zaten alınmış
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || checking || !isAvailable || username.length < 3}
            className="w-full"
          >
            {loading ? 'Kaydediliyor...' : 'Devam Et'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
