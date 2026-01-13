'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect mobile devices for performance optimization
 * Uses both screen size and user agent for accurate detection
 *
 * Note: Returns false during SSR and initial hydration to prevent
 * hydration mismatch. The actual mobile state is determined after mount.
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted to enable client-side detection
    setHasMounted(true)

    const checkMobile = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth < 768

      // Check user agent for mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileUA = mobileRegex.test(navigator.userAgent)

      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Consider mobile if small screen OR (mobile UA AND touch)
      setIsMobile(isSmallScreen || (isMobileUA && hasTouch))
    }

    checkMobile()

    // Debounce resize events to prevent excessive updates
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(checkMobile, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // Return false during SSR/hydration to prevent mismatch
  // After mount, return the actual mobile state
  return hasMounted ? isMobile : false
}
