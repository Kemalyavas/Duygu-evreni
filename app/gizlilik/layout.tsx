import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description:
    'Duygu Evreni gizlilik politikası: hangi verileri topluyoruz, nasıl kullanıyoruz, anonimlik ve haklarınız.',
  alternates: { canonical: '/gizlilik' },
  robots: { index: true, follow: true },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
