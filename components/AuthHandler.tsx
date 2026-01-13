'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/fetch'

/**
 * AuthHandler - Handles Supabase auth redirects
 *
 * This component checks for auth tokens in URL hash and handles:
 * - Password recovery redirects
 * - Email confirmation redirects
 * - Magic link authentication
 */
export function AuthHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip if already on auth-related pages
    if (pathname === '/sifre-sifirla' || pathname === '/auth/callback') {
      return
    }

    const handleAuthRedirect = async () => {
      const hash = window.location.hash

      if (!hash || hash.length < 2) return

      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')
      const error = params.get('error')

      // Handle errors
      if (error) {
        console.error('[AuthHandler] Auth error:', error, params.get('error_description'))
        // Clear hash
        window.history.replaceState(null, '', pathname)
        return
      }

      // Handle recovery (password reset)
      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          const supabase = createClient()

          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('[AuthHandler] Session error:', sessionError)
            return
          }

          // Clear hash and redirect to password reset page
          window.history.replaceState(null, '', '/sifre-sifirla')
          router.push('/sifre-sifirla')
        } catch (err) {
          console.error('[AuthHandler] Error:', err)
        }
        return
      }

      // Handle signup confirmation or magic link
      if ((type === 'signup' || type === 'magiclink') && accessToken && refreshToken) {
        try {
          const supabase = createClient()

          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          // Clear hash and reload
          window.history.replaceState(null, '', pathname)
          window.location.reload()
        } catch (err) {
          console.error('[AuthHandler] Error:', err)
        }
      }
    }

    handleAuthRedirect()
  }, [pathname, router])

  // This component doesn't render anything
  return null
}
