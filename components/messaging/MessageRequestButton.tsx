'use client'

import { Button } from '@/components/ui'
import { useStore } from '@/lib/store/useStore'
import { useAuth } from '@/lib/hooks'
import type { Star } from '@/types'

interface MessageRequestButtonProps {
  star: Star
}

export function MessageRequestButton({ star }: MessageRequestButtonProps) {
  const { user } = useAuth()
  const { setMessageRequestModalOpen, setSelectedStar } = useStore()

  // Giriş yapmamışsa gösterme
  if (!user) return null

  // Kendi yıldızına mesaj gönderemez
  if (user.id === star.user_id) return null

  const handleClick = () => {
    // Store'a yıldızı kaydet ki modal erişebilsin
    setSelectedStar(star)
    setMessageRequestModalOpen(true)
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      className="w-full mt-4 bg-white/5 hover:bg-white/10 border-white/10"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      Mesaj Gönder
    </Button>
  )
}
