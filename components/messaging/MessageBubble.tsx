'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { MessageWithSender } from '@/types'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? 'bg-cyan-500/20 text-white rounded-br-md'
            : 'bg-white/10 text-white/90 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-cyan-400/60' : 'text-white/40'}`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: tr })}
        </p>
      </div>
    </div>
  )
}
