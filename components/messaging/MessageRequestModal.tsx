'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store/useStore'
import { useConversations } from '@/lib/hooks'

const MAX_MESSAGE_LENGTH = 500

export function MessageRequestModal() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState(5)

  const { selectedStar, isMessageRequestModalOpen, setMessageRequestModalOpen, triggerConversationCreated } = useStore()
  const { sendMessageRequest, getRemainingRequests, maxDailyRequests } = useConversations()

  // Kalan istek sayısını al
  useEffect(() => {
    if (isMessageRequestModalOpen) {
      getRemainingRequests().then(setRemainingRequests)
    }
  }, [isMessageRequestModalOpen, getRemainingRequests])

  const handleSend = async () => {
    if (!selectedStar || !message.trim()) return

    try {
      setSending(true)
      setError(null)

      await sendMessageRequest(
        selectedStar.id,
        selectedStar.user_id,
        message.trim()
      )

      // Trigger refresh for MessageRequestButton
      triggerConversationCreated()

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setMessageRequestModalOpen(false)
    setMessage('')
    setError(null)
    setSuccess(false)
  }

  if (!isMessageRequestModalOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          {success ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-medium">
                {remainingRequests === -1 ? 'Mesaj Gönderildi!' : 'İstek Gönderildi!'}
              </h3>
              <p className="text-white/60 text-sm mt-2">
                {remainingRequests === -1
                  ? 'Sohbet başladı, artık mesajlaşabilirsiniz.'
                  : 'Yıldız sahibi isteğini kabul ederse sohbet başlayacak.'
                }
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-semibold">Mesaj İsteği Gönder</h2>
                <button
                  onClick={handleClose}
                  className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <p className="text-white/60 text-sm mb-4">
                Bu yıldızın sahibine anonim bir mesaj isteği göndereceksin.
                Kabul edilirse sohbet başlar ve isimler görünür hale gelir.
              </p>

              {/* Textarea */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>İlk mesajın</span>
                  <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  placeholder="Merhaba, bu yıldızını çok beğendim..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              {/* Daily limit info */}
              <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                <span>Günlük kalan istek hakkın</span>
                <span className={remainingRequests === 0 ? 'text-red-400' : 'text-cyan-400'}>
                  {remainingRequests === -1 ? '∞' : `${remainingRequests}/${maxDailyRequests}`}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Vazgeç
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={!message.trim() || sending || (remainingRequests !== -1 && remainingRequests <= 0)}
                  className="flex-1"
                >
                  {sending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Gönderiliyor
                    </span>
                  ) : (
                    'Gönder'
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
