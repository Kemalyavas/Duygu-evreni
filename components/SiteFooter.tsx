'use client'

import Link from 'next/link'
import { EMOTIONS } from '@/lib/constants/emotions'
import { useTranslation } from '@/lib/i18n'

// Visible site-wide internal-linking footer (SEO: link mesh + discovery).
//
// i18n: selects copy by `language` (not t()), so SSR + the pre-mount render
// stay Turkish — the emotion-link mesh and legal links remain in the crawled
// HTML for tr SEO — while EN users get an English footer after hydration.

const FOOTER = {
  tr: {
    tagline:
      'Duygularını anonim olarak yıldızlara dönüştürüp paylaşabileceğin 3D interaktif bir evren.',
    planets: 'Duygu Gezegenleri',
    universe3d: '3D Evren',
    about: 'Nedir?',
    privacy: 'Gizlilik Politikası',
  },
  en: {
    tagline:
      'A 3D interactive universe where you turn your feelings into stars and share them anonymously.',
    planets: 'Emotion Planets',
    universe3d: '3D Universe',
    about: 'About',
    privacy: 'Privacy Policy',
  },
}

export function SiteFooter() {
  const { language } = useTranslation()
  const isEn = language === 'en'
  const f = isEn ? FOOTER.en : FOOTER.tr

  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-bold text-lg bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
              Duygu Evreni
            </p>
            <p className="mt-2 text-sm text-white/50 max-w-xs leading-relaxed">
              {f.tagline}
            </p>
          </div>

          <nav aria-label={f.planets}>
            <p className="text-sm font-semibold text-white/70 mb-3">{f.planets}</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {EMOTIONS.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/gezegen/${e.slug}`}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {isEn ? e.name_en : e.name_tr}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Duygu Evreni</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white/70 transition-colors">
              {f.universe3d}
            </Link>
            <Link href="/hakkinda" className="hover:text-white/70 transition-colors">
              {f.about}
            </Link>
            <Link href="/gizlilik" className="hover:text-white/70 transition-colors">
              {f.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
