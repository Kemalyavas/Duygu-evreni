'use client'

// Re-export useMusic from MusicProvider for backwards compatibility
// The actual implementation is in MusicProvider which manages audio globally
export { useMusic as useBackgroundMusic } from '@/components/MusicProvider'
