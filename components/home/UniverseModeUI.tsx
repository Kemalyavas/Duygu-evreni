'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface UniverseModeUIProps {
  isVisible: boolean
}

/**
 * UI shown in universe mode - instruction prompt
 */
export function UniverseModeUI({ isVisible }: UniverseModeUIProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-6 py-3 z-20"
        >
          <p className="text-sm text-white/60 text-center">
            Bir gezegene tıklayarak yıldızları keşfet
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
