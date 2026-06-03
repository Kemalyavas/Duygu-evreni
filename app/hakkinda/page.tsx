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
  // HomeSeoSections is self-contained: it renders the CosmicBackground, the full
  // bilingual marketing content (intro, cards, how-it-works, FAQ) and the footer.
  // SSR renders Turkish; EN users see English after hydration (no mismatch).
  return <HomeSeoSections />
}
