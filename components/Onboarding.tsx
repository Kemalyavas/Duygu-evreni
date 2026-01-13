'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_KEY = 'duygu-evreni-onboarding-seen'

const steps = [
  {
    icon: '🌌',
    title: 'Duygu Evreni\'ne Hoş Geldin',
    description: 'Duygularını yıldızlara dönüştür ve kozmik evrende anonim olarak paylaş.',
  },
  {
    icon: '🪐',
    title: '10 Duygu Gezegeni',
    description: 'Her gezegen bir duyguyu temsil eder: Mutluluk, Aşk, Umut, Özlem, Hüzün, Öfke, Depresyon, Korku, Pişmanlık ve Huzur.',
  },
  {
    icon: '✨',
    title: 'Günde 3 Yıldız',
    description: 'Her gün 3 yıldız paylaşabilirsin. Bir gezegene tıkla ve duygunu yaz.',
  },
]

export function Onboarding() {
  const [show, setShow] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY)
    if (!seen) {
      setShow(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShow(false)
  }

  const handleSkip = () => {
    handleClose()
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-[#0A0E27]/95 border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-gradient-to-r from-pink-500 to-purple-500'
                      : index < currentStep
                      ? 'w-4 bg-white/40'
                      : 'w-4 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="text-6xl mb-6">{steps[currentStep].icon}</div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  {steps[currentStep].title}
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between mt-10">
              <button
                onClick={handleSkip}
                className="text-white/40 hover:text-white/60 transition-colors text-sm"
              >
                Atla
              </button>

              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                {currentStep === steps.length - 1 ? 'Başla' : 'Devam'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
