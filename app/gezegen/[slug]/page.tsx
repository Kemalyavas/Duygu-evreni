import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  EMOTION_SLUGS,
  getEmotionBySlug,
  type EmotionContent,
} from '@/lib/constants/emotions'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duyguevreni.com'

// Yıldız sayıları periyodik tazelenir (statik + ISR). Public veri, cookie yok.
export const revalidate = 3600

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return EMOTION_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const emotion = getEmotionBySlug(slug)
  if (!emotion) return {}

  const url = `${siteUrl}/gezegen/${emotion.slug}`
  return {
    title: emotion.metaTitle,
    description: emotion.metaDescription,
    keywords: emotion.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${emotion.heading} | Duygu Evreni`,
      description: emotion.metaDescription,
      url,
      type: 'article',
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title: emotion.heading,
      description: emotion.metaDescription,
    },
  }
}

// Public (cookie'siz) Supabase okuması — gezegen UUID'si + yıldız sayısı
async function getPlanetStats(
  nameTr: string
): Promise<{ id: string | null; starCount: number | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return { id: null, starCount: null }

  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)
    const { data: planet } = await supabase
      .from('planets')
      .select('id')
      .eq('name_tr', nameTr)
      .single()

    if (!planet?.id) return { id: null, starCount: null }

    const { count } = await supabase
      .from('stars')
      .select('id', { count: 'exact', head: true })
      .eq('planet_id', planet.id)

    return { id: planet.id, starCount: count ?? null }
  } catch {
    return { id: null, starCount: null }
  }
}

export default async function PlanetContentPage({ params }: Params) {
  const { slug } = await params

  // Eski /gezegen/<uuid> linkleri → 3D evrene yönlendir (geriye uyumluluk)
  if (UUID_RE.test(slug)) {
    redirect(`/?planet=${slug}`)
  }

  const emotion = getEmotionBySlug(slug)
  if (!emotion) notFound()

  const { id: planetId, starCount } = await getPlanetStats(emotion.name_tr)
  const exploreHref = planetId ? `/?planet=${planetId}` : '/'
  const related = emotion.related
    .map(getEmotionBySlug)
    .filter((e): e is EmotionContent => Boolean(e))

  const pageUrl = `${siteUrl}/gezegen/${emotion.slug}`

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: emotion.name_tr, item: pageUrl },
    ],
  }

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${emotion.name_tr} - Duygu Evreni`,
    description: emotion.metaDescription,
    url: pageUrl,
    inLanguage: 'tr-TR',
    isPartOf: { '@type': 'WebSite', name: 'Duygu Evreni', url: siteUrl },
    about: { '@type': 'Thing', name: emotion.name_tr },
    ...(starCount != null ? { numberOfItems: starCount } : {}),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />

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
            3D Evren
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="text-sm text-white/40 mb-6">
          <Link href="/" className="hover:text-white/70">
            Ana Sayfa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{emotion.name_tr}</span>
        </nav>

        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ color: emotion.color }}
        >
          {emotion.heading}
        </h1>

        {starCount != null && starCount > 0 && (
          <p className="text-white/50 mb-8">
            {starCount} yıldız paylaşıldı
          </p>
        )}

        <p className="text-lg text-white/85 leading-relaxed mb-6">{emotion.lead}</p>
        {emotion.body.map((paragraph, i) => (
          <p key={i} className="text-white/70 leading-relaxed mb-5">
            {paragraph}
          </p>
        ))}

        {emotion.supportNote && (
          <div className="my-8 rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-white/80 leading-relaxed">{emotion.supportNote}</p>
          </div>
        )}

        {/* CTA */}
        <div className="my-10">
          <Link
            href={exploreHref}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-opacity hover:opacity-90"
          >
            {emotion.name_tr} gezegenini 3D evrende keşfet
          </Link>
        </div>

        {/* Related */}
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold mb-4">Diğer duygular</h2>
          <ul className="flex flex-wrap gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/gezegen/${r.slug}`}
                  className="inline-block rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/30 hover:text-white"
                  style={{ borderColor: `${r.color}40` }}
                >
                  {r.name_tr}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href="/" className="text-purple-300 hover:text-purple-200">
              Tüm duygu evrenini keşfet →
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
