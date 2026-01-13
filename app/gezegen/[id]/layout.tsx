import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

// Planet name mapping for SEO
const planetNames: Record<string, { name: string; description: string }> = {
  'umut': {
    name: 'Umut',
    description: 'Umut ve beklentilerini paylaş. Geleceğe dair hayallerini, dileklerini ve umutlarını yıldızlara dönüştür.',
  },
  'sevgi': {
    name: 'Sevgi',
    description: 'Sevgi ve aşk duygularını paylaş. Aşk, dostluk ve şefkat dolu duygularını yıldızlara dönüştür.',
  },
  'mutluluk': {
    name: 'Mutluluk',
    description: 'Mutluluk ve sevinçlerini paylaş. Neşe, heyecan ve minnettarlık duygularını yıldızlara dönüştür.',
  },
  'uzuntu': {
    name: 'Üzüntü',
    description: 'Üzüntü ve hüzünlerini paylaş. Kederini, özlemini ve melankolini yıldızlara dönüştür.',
  },
  'ofke': {
    name: 'Öfke',
    description: 'Öfke ve kızgınlıklarını paylaş. Hayal kırıklıklarını, sinirini yıldızlara dönüştür.',
  },
  'korku': {
    name: 'Korku',
    description: 'Korku ve endişelerini paylaş. Kaygılarını, tedirginliklerini yıldızlara dönüştür.',
  },
}

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  // Try to get planet from database
  const supabase = await createClient()
  const { data: planet } = await supabase
    .from('planets')
    .select('name, description')
    .eq('id', id)
    .single()

  // Use database data or fallback to mapping
  const planetInfo = planet || planetNames[id.toLowerCase()] || {
    name: 'Gezegen',
    description: 'Duygu Evreni gezegeninde duygularını keşfet ve paylaş.',
  }

  return {
    title: planetInfo.name,
    description: planetInfo.description,
    alternates: {
      canonical: `/?planet=${id}`,
    },
    openGraph: {
      title: `${planetInfo.name} | Duygu Evreni`,
      description: planetInfo.description,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function PlanetLayout({ children }: { children: React.ReactNode }) {
  return children
}
