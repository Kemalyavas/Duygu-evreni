import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evren',
  description: '3D interaktif duygu evrenini keşfet. Umut, sevgi, mutluluk, üzüntü, öfke ve korku gezegenlerinde binlerce duygu yıldızını oku ve kendi duygularını paylaş.',
  alternates: {
    canonical: '/evren',
  },
  openGraph: {
    title: 'Duygu Evreni - 3D İnteraktif Evren',
    description: '3D interaktif duygu evrenini keşfet. 6 farklı gezegende binlerce duygu yıldızını oku.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function UniverseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
