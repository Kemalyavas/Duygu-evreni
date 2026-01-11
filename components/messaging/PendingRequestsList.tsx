'use client'

import { AnimatePresence } from 'framer-motion'
import { PendingRequestCard } from './PendingRequestCard'
import type { ConversationWithDetails } from '@/types'

interface PendingRequestsListProps {
  requests: ConversationWithDetails[]
  onRespond?: () => void
}

export function PendingRequestsList({ requests, onRespond }: PendingRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">Bekleyen mesaj isteği yok</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {requests.map((request) => (
          <PendingRequestCard
            key={request.id}
            request={request}
            onRespond={onRespond}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
