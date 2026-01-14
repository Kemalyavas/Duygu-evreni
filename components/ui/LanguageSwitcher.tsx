'use client'

import { useLanguage, type Language } from '@/lib/i18n'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    const newLang: Language = language === 'tr' ? 'en' : 'tr'
    setLanguage(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium text-white/80 hover:text-white ${className}`}
      title={language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
    >
      <span className="text-base">{language === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
      <span className="uppercase">{language}</span>
    </button>
  )
}
