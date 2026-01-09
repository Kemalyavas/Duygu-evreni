import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Şifre Sıfırla',
  description: 'Duygu Evreni hesabının şifresini sıfırla.',
  alternates: {
    canonical: '/sifre-sifirla',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PasswordResetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
