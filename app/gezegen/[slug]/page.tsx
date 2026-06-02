import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { EMOTION_SLUGS, getEmotionBySlug } from '@/lib/constants/emotions'
import { PlanetArticle } from '@/components/PlanetArticle'

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
  const pageUrl = `${siteUrl}/gezegen/${emotion.slug}`

  // JSON-LD şemaları Türkçe — sayfa Türkçe-canonical (tr_TR); crawler SSR'da
  // Türkçe içerik + Türkçe şema görür. Görünür makale (PlanetArticle) ise
  // client'ta dile göre TR/EN render eder (SSR Türkçe → SEO korunur).
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

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: emotion.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <PlanetArticle slug={emotion.slug} starCount={starCount} planetId={planetId} />
    </div>
  )
}
