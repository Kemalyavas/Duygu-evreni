'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui'
import { useConversations } from '@/lib/hooks'
import type { ConversationWithDetails } from '@/types'

interface PendingRequestCardProps {
  request: ConversationWithDetails
  onRespond?: () => void
}

export function PendingRequestCard({ request, onRespond }: PendingRequestCardProps) {
  const [responding, setResponding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { respondToRequest } = useConversations()

  // Respect privacy setting for initiator
  const initiatorUsername = (request.initiator?.show_username_in_chats !== false && request.initiator?.username)
    ? request.initiator.username
    : 'Anonim'

  const handleRespond = async (accept: boolean) => {
    try {
      setResponding(true)
      setError(null)
      await respondToRequest(request.id, accept)
      onRespond?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setResponding(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors"
    >
      {/* Yıldız Bilgisi */}
      {request.star && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-white/5 rounded-lg border border-white/5">
          <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <p className="text-white/50 text-xs truncate italic">
            &ldquo;{request.star.content.slice(0, 50)}{request.star.content.length > 50 ? '...' : ''}&rdquo;
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-white/80 text-sm font-medium">
            {initiatorUsername[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/40 text-xs mb-1">
            Bu yıldızın üzerinden mesaj gönderdi · {formatDistanceToNow(new Date(request.created_at), { addSuffix: false, locale: tr })}
          </p>
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
            {request.first_message}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mb-3 bg-red-500/10 p-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleRespond(false)}
          disabled={responding}
          className="flex-1 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
        >
          Reddet
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleRespond(true)}
          disabled={responding}
          className="flex-1"
        >
          {responding ? 'İşleniyor...' : 'Kabul Et'}
        </Button>
      </div>
    </motion.div>
  )
}
