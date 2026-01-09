import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'Duygu Evreni hesabına giriş yap. Duygularını yıldızlara dönüştür ve evrende paylaş.',
  alternates: {
    canonical: '/giris',
  },
  openGraph: {
    title: 'Giriş Yap | Duygu Evreni',
    description: 'Duygu Evreni hesabına giriş yap. Duygularını yıldızlara dönüştür ve evrende paylaş.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
