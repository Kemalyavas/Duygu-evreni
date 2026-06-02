import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kayıt Ol',
  description: 'Duygu Evreni\'ne ücretsiz kayıt ol. Duygularını yıldızlara dönüştür, 3D interaktif evrende paylaş ve başkalarının duygularını keşfet.',
  alternates: {
    canonical: '/kayit',
  },
  openGraph: {
    title: 'Kayıt Ol | Duygu Evreni',
    description: 'Duygu Evreni\'ne ücretsiz kayıt ol. Duygularını yıldızlara dönüştür ve evrende paylaş.',
    type: 'website',
  },
  // Auth utility page — no SEO value, keep out of the index (link equity still flows).
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
