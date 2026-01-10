'use client'

import { AuthHandler } from './AuthHandler'
import { MusicProvider } from './MusicProvider'

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Client-side providers wrapper
 * Add any client-side providers here (auth handlers, context providers, etc.)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <MusicProvider>
      <AuthHandler />
      {children}
    </MusicProvider>
  )
}
