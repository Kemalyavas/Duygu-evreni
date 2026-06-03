'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { MessageRequestButton } from '@/components/messaging'
import { ShareButtons } from '@/components/ShareButtons'
import { useTranslation } from '@/lib/i18n'
import type { Star } from '@/types'

interface StarViewPanelProps {
  star: Star | null
  onClose: () => void
  planetColor?: string
}

export function StarViewPanel({ star, onClose, planetColor = '#ffffff' }: StarViewPanelProps) {
  const { t, language } = useTranslation()
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: language === 'en' ? enUS : tr,
      })
    } catch {
      return ''
    }
  }

  return (
    <AnimatePresence>
      {star && (
        <>
          {/* Desktop: Side panel */}
          <motion.div
            key="desktop-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden md:block fixed right-0 top-20 bottom-0 w-96 bg-[#0d0d1a]/95 backdrop-blur-xl border-l border-white/10 rounded-tl-2xl z-30 shadow-2xl"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: planetColor }}
                  />
                  <span className="text-white/60 text-sm">{t('misc.starLabel')}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-white text-lg leading-relaxed">{star.content}</p>
              </div>

              {/* Message Button */}
              <MessageRequestButton star={star} />

              {/* Share Button */}
              <div className="pt-3">
                <ShareButtons
                  url={`/yildiz/${star.id}`}
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10">
                <span className="text-white/40 text-sm">
                  {formatDate(star.created_at)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Mobile: Bottom sheet - positioned above the action buttons */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed left-0 right-0 bottom-28 bg-[#0d0d1a]/95 backdrop-blur-xl border-t border-white/10 z-30 rounded-3xl max-h-[50vh] shadow-2xl mx-3 overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: planetColor }}
                  />
                  <span className="text-white/60 text-sm">{t('misc.starLabel')}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <p className="text-white text-lg leading-relaxed mb-4">
                {star.content}
              </p>

              {/* Message Button */}
              <MessageRequestButton star={star} />

              {/* Share Button */}
              <div className="pt-3">
                <ShareButtons
                  url={`/yildiz/${star.id}`}
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 mt-4">
                <span className="text-white/40 text-sm">
                  {formatDate(star.created_at)}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
