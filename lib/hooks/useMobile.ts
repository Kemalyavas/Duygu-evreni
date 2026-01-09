'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect mobile devices for performance optimization
 * Uses both screen size and user agent for accurate detection
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
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
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
