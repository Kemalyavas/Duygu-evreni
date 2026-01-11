'use client'

import { useState, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSend: (message: string) => Promise<unknown>
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return

    try {
      setSending(true)
      await onSend(message.trim())
      setMessage('')
    } catch {
      // Error handling done in parent
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-white/10 bg-[#0d0d1a]/80">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın..."
          disabled={disabled || sending}
          rows={1}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-white/30 text-xs mt-2">
        Enter ile gönder, Shift+Enter ile satır atla
      </p>
    </div>
  )
}
