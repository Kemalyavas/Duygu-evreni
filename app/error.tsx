'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { useTranslation } from '@/lib/i18n'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    // Log error to console in development
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Broken star icon */}
        <div className="text-6xl mb-6 opacity-60">
          <span className="inline-block animate-pulse">💫</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {t('errorPages.errorTitle')}
        </h1>

        <p className="text-white/60 mb-8">
          {t('errorPages.errorDescription')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => reset()}
          >
            {t('errorPages.retry')}
          </Button>

          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              {t('errorPages.backHome')}
            </Button>
          </Link>
        </div>

        {/* Subtle error code for debugging */}
        {error.digest && (
          <p className="mt-8 text-xs text-white/20 font-mono">
            {t('errorPages.errorCode')}: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  )
}
