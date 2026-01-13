import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Duygu Evreni profilini görüntüle. Oluşturduğun yıldızları, istatistiklerini ve rozetlerini takip et.',
  alternates: {
    canonical: '/profil',
  },
  // Profile page should not be indexed (private user data)
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
