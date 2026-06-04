'use client'

import { MotionConfig } from 'framer-motion'
import { AuthHandler } from './AuthHandler'
import { MusicProvider } from './MusicProvider'
import { ChatPanel } from './messaging/ChatPanel'
import { LanguageProvider } from '@/lib/i18n'
import { NotificationsProvider } from '@/lib/hooks'

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Client-side providers wrapper
 * Add any client-side providers here (auth handlers, context providers, etc.)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      {/* reducedMotion="user" makes all framer-motion animations respect the OS setting */}
      <MotionConfig reducedMotion="user">
        <MusicProvider>
          {/* Single global notifications source (one realtime channel + fetch
              + sound) shared by the bell, panel, list and profile. */}
          <NotificationsProvider>
            <AuthHandler />
            {children}
            {/* Global Chat Panel - tüm sayfalarda görünür */}
            <ChatPanel />
          </NotificationsProvider>
        </MusicProvider>
      </MotionConfig>
    </LanguageProvider>
  )
}
