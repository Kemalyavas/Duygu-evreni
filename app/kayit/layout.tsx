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
  robots: {
    index: true,
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
