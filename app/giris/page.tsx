'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button, Input, Card } from '@/components/ui'
import { useAuth } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/fetch'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // Use hard navigation to ensure cookies are sent
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        throw error
      }

      setResetSuccess(true)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0A0E27] to-black">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold cosmic-text">Duygu Evreni</h1>
            </Link>
            <p className="text-white/60 mt-2">Hesabına giriş yap</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Şifre"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setResetEmail(email)
                }}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors mt-2"
              >
                Şifremi unuttum
              </button>
            </div>

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
              isLoading={loading}
              className="w-full"
            >
              Giriş Yap
            </Button>
          </form>

          {/* Signup link */}
          <p className="text-center text-white/60 mt-6">
            Hesabın yok mu?{' '}
            <Link
              href="/kayit"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Kayıt ol
            </Link>
          </p>
        </Card>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1a1f3c] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {resetSuccess ? (
                <div className="text-center">
                  <div className="text-green-400 text-4xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Email Gönderildi!
                  </h3>
                  <p className="text-white/60 mb-4">
                    Şifre sıfırlama linki <strong>{resetEmail}</strong> adresine gönderildi.
                    Lütfen email kutunu kontrol et.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setResetSuccess(false)
                    }}
                  >
                    Kapat
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Şifreni Sıfırla
                  </h3>
                  <p className="text-white/60 mb-4 text-sm">
                    Email adresini gir, şifre sıfırlama linki gönderelim.
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <Input
                      label="E-posta"
                      type="email"
                      placeholder="ornek@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />

                    {resetError && (
                      <p className="text-red-400 text-sm text-center">
                        {resetError}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        isLoading={resetLoading}
                      >
                        Gönder
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
