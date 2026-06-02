import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kullanıcı Adı Belirle',
  // Private onboarding step — must not be indexed.
  robots: { index: false, follow: false },
}

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
