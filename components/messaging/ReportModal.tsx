'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBlocking } from '@/lib/hooks'
import { useTranslation } from '@/lib/i18n'
import type { ReportReason } from '@/types'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  conversationId?: string
}

const REPORT_REASONS: { value: ReportReason; labelKey: string }[] = [
  { value: 'spam', labelKey: 'report.reasons.spam' },
  { value: 'harassment', labelKey: 'report.reasons.harassment' },
  { value: 'inappropriate', labelKey: 'report.reasons.inappropriate' },
  { value: 'other', labelKey: 'report.reasons.other' },
]

export function ReportModal({ isOpen, onClose, userId, conversationId }: ReportModalProps) {
  const { t } = useTranslation()
  const { reportUser, loading } = useBlocking()
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedReason || !userId) return

    try {
      setError(null)
      await reportUser(userId, selectedReason, conversationId, description || undefined)
      setIsSuccess(true)
      setTimeout(() => {
        onClose()
        // Reset state
        setSelectedReason(null)
        setDescription('')
        setIsSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('report.error'))
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setSelectedReason(null)
      setDescription('')
      setIsSuccess(false)
      setError(null)
    }
  }

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-[#0d0d1a] border border-white/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">{t('report.title')}</h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/50 text-sm mt-1">{t('report.description')}</p>
            </div>

            {/* Content */}
            <div className="p-4">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">{t('report.success')}</p>
                  <p className="text-white/50 text-sm mt-1">{t('report.successDescription')}</p>
                </div>
              ) : (
                <>
                  {/* Reason selection */}
                  <div className="space-y-2 mb-4">
                    <label className="text-white/70 text-sm">{t('report.selectReason')}</label>
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason.value}
                        onClick={() => setSelectedReason(reason.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                          selectedReason === reason.value
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {t(reason.labelKey)}
                      </button>
                    ))}
                  </div>

                  {/* Description for "other" */}
                  {selectedReason === 'other' && (
                    <div className="mb-4">
                      <label className="text-white/70 text-sm block mb-2">{t('report.additionalInfo')}</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('report.additionalInfoPlaceholder')}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20"
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || loading}
                    className="w-full py-3 bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? t('common.loading') : t('report.submit')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
