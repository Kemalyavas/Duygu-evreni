'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import tr from './translations/tr.json'
import en from './translations/en.json'

export type Language = 'tr' | 'en'

type TranslationValue = string | { [key: string]: TranslationValue }
type Translations = typeof tr

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  translations: Translations
}

const translations: Record<Language, Translations> = { tr, en }

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
      setLanguageState(savedLang)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'tr') {
        setLanguageState('tr')
      } else {
        setLanguageState('en')
      }
    }
    setMounted(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: TranslationValue = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value]
      } else {
        // Fallback to Turkish if key not found
        let fallback: TranslationValue = translations['tr']
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk as keyof typeof fallback]
          } else {
            return key // Return key if not found in fallback either
          }
        }
        value = fallback
        break
      }
    }

    let result = typeof value === 'string' ? value : key

    // Replace {{param}} placeholders with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue))
      })
    }

    return result
  }, [language])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'tr', setLanguage, t: (key: string) => key, translations: tr }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Export a simple hook for just the translation function
export function useTranslation() {
  const { t, language } = useLanguage()
  return { t, language }
}
