'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-[#1a1f4e] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl text-white/80 mb-8">{t('errorPages.notFoundTitle')}</h2>
        <p className="text-white/60 mb-8">
          {t('errorPages.notFoundDescription')}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {t('errorPages.backHome')}
        </Link>
      </div>
    </div>
  )
}
