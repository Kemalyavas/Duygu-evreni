import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Duygu Evreni" width={36} height={36} />
            <span className="font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
              Duygu Evreni
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            3D Evrene Gir
          </Link>
        </div>
      </header>

      {/* Tüm tanıtım içeriği (intro, duygu kartları, nasıl çalışır, SSS) + footer */}
      <HomeSeoSections />
    </div>
  )
}
