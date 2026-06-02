'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getEmotionBySlug, type EmotionContent } from '@/lib/constants/emotions'
import { SiteFooter } from '@/components/SiteFooter'
import { useTranslation } from '@/lib/i18n'

// Visible article body for /gezegen/[slug]. Bilingual via `language` (not t()),
// so SSR/ISR renders Turkish (the page's metadata + JSON-LD schema stay tr for
// SEO/canonical) while EN users get English after hydration — no mismatch.

const CHROME = {
  tr: {
    universe3d: '3D Evren',
    home: 'Ana Sayfa',
    starsShared: (n: number) => `${n} yıldız paylaşıldı`,
    exploreCta: (name: string) => `${name} gezegenini 3D evrende keşfet`,
    faqTitle: 'Sık Sorulan Sorular',
    otherEmotions: 'Diğer duygular',
    exploreAll: 'Tüm duygu evrenini keşfet →',
  },
  en: {
    universe3d: '3D Universe',
    home: 'Home',
    starsShared: (n: number) => `${n} ${n === 1 ? 'star' : 'stars'} shared`,
    exploreCta: (name: string) => `Explore the ${name} planet in the 3D universe`,
    faqTitle: 'Frequently Asked Questions',
    otherEmotions: 'Other emotions',
    exploreAll: 'Explore the whole Emotion Universe →',
  },
}

interface PlanetArticleProps {
  slug: string
  starCount: number | null
  planetId: string | null
}

export function PlanetArticle({ slug, starCount, planetId }: PlanetArticleProps) {
  const { language } = useTranslation()
  const isEn = language === 'en'
  const c = isEn ? CHROME.en : CHROME.tr

  const emotion = getEmotionBySlug(slug)
  if (!emotion) return null

  const name = isEn ? emotion.name_en : emotion.name_tr
  const heading = isEn ? emotion.heading_en : emotion.heading
  const lead = isEn ? emotion.lead_en : emotion.lead
  const body = isEn ? emotion.body_en : emotion.body
  const faqs = isEn ? emotion.faqs_en : emotion.faqs
  const supportNote = isEn ? emotion.supportNote_en : emotion.supportNote
  const exploreHref = planetId ? `/?planet=${planetId}` : '/'
  const related = emotion.related
    .map(getEmotionBySlug)
    .filter((e): e is EmotionContent => Boolean(e))

  return (
    <>
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Duygu Evreni" width={36} height={36} />
            <span className="font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
              Duygu Evreni
            </span>
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            {c.universe3d}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/70">
            {c.home}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{name}</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: emotion.color }}>
          {heading}
        </h1>

        {starCount != null && starCount > 0 && (
          <p className="text-white/50 mb-8">{c.starsShared(starCount)}</p>
        )}

        <p className="text-lg text-white/85 leading-relaxed mb-6">{lead}</p>
        {body.map((paragraph, i) => (
          <p key={i} className="text-white/70 leading-relaxed mb-5">
            {paragraph}
          </p>
        ))}

        {supportNote && (
          <div className="my-8 rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-white/80 leading-relaxed">{supportNote}</p>
          </div>
        )}

        {/* CTA */}
        <div className="my-10">
          <Link
            href={exploreHref}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-opacity hover:opacity-90"
          >
            {c.exploreCta(name)}
          </Link>
        </div>

        {/* SSS */}
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold mb-6">{c.faqTitle}</h2>
          <div className="space-y-5">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-white/90 mb-1.5">{f.q}</h3>
                <p className="text-white/65 leading-relaxed text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold mb-4">{c.otherEmotions}</h2>
          <ul className="flex flex-wrap gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/gezegen/${r.slug}`}
                  className="inline-block rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/30 hover:text-white"
                  style={{ borderColor: `${r.color}40` }}
                >
                  {isEn ? r.name_en : r.name_tr}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href="/" className="text-purple-300 hover:text-purple-200">
              {c.exploreAll}
            </Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
