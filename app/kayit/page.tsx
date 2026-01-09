'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Input, Card } from '@/components/ui'
import { useAuth } from '@/lib/hooks'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validation
    if (username.length < 2) {
      setError('Kullanıcı adı en az 2 karakter olmalıdır')
      setLoading(false)
      return
    }

    if (username.length > 20) {
      setError('Kullanıcı adı en fazla 20 karakter olabilir')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, username)
      setSuccess(true)
      // Redirect after short delay with hard navigation
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt olunamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0A0E27] to-black">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
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
            <p className="text-white/60 mt-2">Yeni hesap oluştur</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="text-4xl mb-4">🌟</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Kayıt Başarılı!
              </h2>
              <p className="text-white/60">
                Evrene yönlendiriliyorsunuz...
              </p>
            </motion.div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Kullanıcı Adı"
                  type="text"
                  placeholder="kullanici_adi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <Input
                  label="E-posta"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Şifre"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  label="Şifre Tekrar"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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
                  isLoading={loading}
                  className="w-full"
                >
                  Kayıt Ol
                </Button>
              </form>

              {/* Login link */}
              <p className="text-center text-white/60 mt-6">
                Zaten hesabın var mı?{' '}
                <Link
                  href="/giris"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Giriş yap
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
