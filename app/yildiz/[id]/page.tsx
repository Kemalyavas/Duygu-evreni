import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.duyguevreni.com'

// Paylaşım landing'i — sosyal unfurl için zengin OG, kullanıcıya 3D evrene köprü.
// Bireysel yıldız (kişisel içerik) Google'a AÇILMAZ (noindex); sadece paylaşım.
export const revalidate = 3600

type Params = { params: Promise<{ id: string }> }
type StarRow = {
  id: string
  planet_id: string
  planets: { name_tr: string; name_en: string; color: string } | null
}

async function getStar(id: string): Promise<StarRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const supabase = createSupabaseClient(url, key)
    const { data } = await supabase
      .from('stars')
      .select('id, planet_id, planets(name_tr, name_en, color)')
      .eq('id', id)
      .single()
    return (data as unknown as StarRow) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const star = await getStar(id)
  const name = star?.planets?.name_tr ?? 'Bir yıldız'
  const title = `${name} · Duygu Evreni`
  const description = `${name} gezegeninde paylaşılan anonim bir yıldız. Duygu Evreni'nde 3D evreni keşfet.`
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/yildiz/${id}`,
      type: 'website',
      locale: 'tr_TR',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function StarSharePage({ params }: Params) {
  const { id } = await params
  const star = await getStar(id)
  if (!star) redirect('/')

  const color = star.planets?.color ?? '#8b5cf6'
  const name = star.planets?.name_tr ?? 'Bir yıldız'
  const exploreHref = `/?planet=${star.planet_id}&star=${star.id}`

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-[#06070f] via-[#0A0E27] to-[#06070f] text-white flex flex-col items-center justify-center px-6">
      {/* ambient emotion glow */}
      <div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        }}
      />

      <main className="relative z-10 flex flex-col items-center text-center">
        {/* glowing emotion orb */}
        <div
          className="rounded-full"
          style={{
            width: 168,
            height: 168,
            background: `radial-gradient(circle at 34% 30%, #ffffff 0%, ${color} 36%, ${color}cc 68%, ${color}44 100%)`,
            boxShadow: `0 0 90px 14px ${color}55, inset -16px -16px 44px rgba(0,0,0,0.5)`,
          }}
        />

        <h1
          className="mt-8 text-4xl sm:text-5xl font-bold"
          style={{ textShadow: `0 0 36px ${color}99` }}
        >
          {name}
        </h1>
        <p className="mt-2 text-white/55">evrende bir yıldız</p>

        <Link
          href={exploreHref}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-purple-500/25 transition-opacity hover:opacity-90"
        >
          3D evrende gör
        </Link>

        <Link
          href="/"
          className="mt-5 text-sm text-white/45 hover:text-white/80 transition-colors"
        >
          Duygu Evreni&apos;ni keşfet
        </Link>
      </main>

      {/* brand */}
      <div className="absolute bottom-6 z-10 flex items-center gap-2 opacity-80">
        <Image src="/logo.png" alt="Duygu Evreni" width={28} height={28} />
        <span className="font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
          Duygu Evreni
        </span>
      </div>
    </div>
  )
}
