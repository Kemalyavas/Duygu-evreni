import type { Metadata } from 'next'
import { HomeSeoSections } from '@/components/home/HomeSeoSections'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duyguevreni.com'

export const metadata: Metadata = {
  title: {
    absolute: 'Duygu Evreni Nedir? Anonim Duygu Paylaşma Platformu',
  },
  description:
    'Duygu Evreni; duygularını anonim olarak yıldızlara dönüştürüp paylaşabileceğin 3D interaktif bir platformdur. Nedir, nasıl çalışır ve hangi duygu gezegenleri var? Keşfet.',
  keywords: [
    'duygu evreni',
    'duygu evreni nedir',
    'anonim duygu paylaşma',
    'duygu paylaşma sitesi',
    'anonim itiraf',
    'duygularını paylaş',
  ],
  alternates: { canonical: `${siteUrl}/hakkinda` },
  openGraph: {
    title: 'Duygu Evreni Nedir?',
    description:
      'Duygularını anonim olarak yıldızlara dönüştürüp paylaşabileceğin 3D interaktif bir evren. Nasıl çalışır, keşfet.',
    url: `${siteUrl}/hakkinda`,
    type: 'website',
    locale: 'tr_TR',
  },
}

export default function HakkindaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black text-white">
      {/* Header + tüm tanıtım içeriği (intro, kartlar, nasıl çalışır, SSS) + footer
          — iki dilli (TR/EN); SSR Türkçe render eder, EN kullanıcı hydration sonrası İngilizce görür */}
      <HomeSeoSections />
    </div>
  )
}
