'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNicknames } from '@/lib/hooks'
import { useModalA11y } from '@/lib/hooks/useModalA11y'
import { useTranslation } from '@/lib/i18n'

interface NicknameModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  currentNickname?: string | null
  onNicknameChange?: (nickname: string | null) => void
}

export function NicknameModal({
  isOpen,
  onClose,
  conversationId,
  currentNickname,
  onNicknameChange
}: NicknameModalProps) {
  const { t } = useTranslation()
  const { setNickname, removeNickname, loading } = useNicknames()
  const [nickname, setNicknameValue] = useState(currentNickname || '')
  const [error, setError] = useState<string | null>(null)

  // Sync with current nickname when modal opens
  useEffect(() => {
    if (isOpen) {
      setNicknameValue(currentNickname || '')
      setError(null)
    }
  }, [isOpen, currentNickname])

  const handleSave = async () => {
    try {
      setError(null)
      const trimmed = nickname.trim()

      if (trimmed) {
        await setNickname(conversationId, trimmed)
        onNicknameChange?.(trimmed)
      } else if (currentNickname) {
        // If cleared and there was a nickname, remove it
        await removeNickname(conversationId)
        onNicknameChange?.(null)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('nickname.error'))
    }
  }

  const handleRemove = async () => {
    try {
      setError(null)
      await removeNickname(conversationId)
      onNicknameChange?.(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('nickname.error'))
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, handleClose)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nickname-modal-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 id="nickname-modal-title" className="text-white font-medium">{t('nickname.title')}</h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/50 text-sm mt-1">{t('nickname.description')}</p>
            </div>

            {/* Content */}
            <div className="p-4">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNicknameValue(e.target.value)}
                placeholder={t('nickname.placeholder')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                maxLength={50}
                autoFocus
              />
              <p className="text-white/30 text-xs mt-2 text-right">{nickname.length}/50</p>

              {/* Error message */}
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                {currentNickname && (
                  <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {t('nickname.remove')}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 bg-cyan-500/80 hover:bg-cyan-500 text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
                >
                  {loading ? t('common.loading') : t('nickname.save')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
