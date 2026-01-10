'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, ErrorBoundary, MusicToggle } from '@/components/ui'
import { Onboarding } from '@/components/Onboarding'
import { StarCreationModal } from '@/components/StarCreationModal'
import { StarViewPanel } from '@/components/StarViewPanel'
import { useAuth, usePlanets, useStars, useStarCounts, useDailyLimit, useReadStars, useMobile, useSoundEffects } from '@/lib/hooks'
import type { Planet, Star } from '@/types'

// Dynamic import for 3D component (client-side only)
const UnifiedUniverse = dynamic(
  () => import('@/components/3d/UnifiedUniverse').then((mod) => mod.UnifiedUniverse),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black">
        <div className="text-white text-lg animate-pulse">Evren yükleniyor...</div>
      </div>
    ),
  }
)

// Wrapper component to handle useSearchParams with Suspense
function HomePageContent() {
  const searchParams = useSearchParams()
  const planetIdFromUrl = searchParams.get('planet')
  const starIdFromUrl = searchParams.get('star')

  const { user, isLoading: authLoading, signOut } = useAuth()
  const { planets, loading: planetsLoading, error: planetsError } = usePlanets()
  const { stars, loading: starsLoading, fetchAllStars, fetchStarsByPlanet } = useStars()
  const { starCounts, refetchCounts } = useStarCounts()
  const { remainingStars, isAdmin } = useDailyLimit()
  const { readStarIds, markAsRead } = useReadStars()
  const isMobile = useMobile()
  const { playPlanetClick, playStarClick, playAddStar } = useSoundEffects()

  const [focusedPlanetId, setFocusedPlanetId] = useState<string | null>(planetIdFromUrl)
  const [selectedStar, setSelectedStar] = useState<Star | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Lazy initialize from localStorage to avoid useEffect setState
  const [hasClickedStar, setHasClickedStar] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('duygu-evreni-star-clicked') === 'true'
  })
  const [initialLoadComplete, setInitialLoadComplete] = useState(false) // Track if initial stars load is done
  const [hasStartedLoading, setHasStartedLoading] = useState(false) // Track if loading has started for current planet
  const [starsVisuallyReady, setStarsVisuallyReady] = useState(false) // Track when stars are visible (after vortex)

  // Welcome message for first-time visitors to Umut planet
  const UMUT_PLANET_ID = '1ad9ca47-4ead-4a55-aa3a-5d048fd9f6c5'
  const WELCOME_STAR_ID = '2b533690-baf6-4bbc-9ff1-57bf98683afe'

  useEffect(() => {
    // Only trigger for Umut planet
    if (focusedPlanetId !== UMUT_PLANET_ID) return
    // Only trigger when stars are loaded and visually ready
    if (!starsVisuallyReady || stars.length === 0) return
    // Don't trigger if there's already a star in URL
    if (starIdFromUrl) return

    // Check if user has seen the welcome message before
    const hasSeenWelcome = localStorage.getItem('duygu-evreni-welcomed')
    if (hasSeenWelcome) return

    // Find the welcome star
    const welcomeStar = stars.find(s => s.id === WELCOME_STAR_ID)
    if (!welcomeStar) return

    // Auto-select the welcome star after a short delay
    const timer = setTimeout(() => {
      setSelectedStar(welcomeStar)
      markAsRead(welcomeStar.id)
      // Mark as welcomed so it doesn't show again
      localStorage.setItem('duygu-evreni-welcomed', 'true')
      // Also mark that user has clicked a star
      setHasClickedStar(true)
      localStorage.setItem('duygu-evreni-star-clicked', 'true')
    }, 1000)

    return () => clearTimeout(timer)
  }, [focusedPlanetId, starsVisuallyReady, stars, starIdFromUrl, markAsRead])

  // Get focused planet object
  const focusedPlanet = planets.find(p => p.id === focusedPlanetId) || null

  // Reset loading states when planet changes
  useEffect(() => {
    setInitialLoadComplete(false)
    setHasStartedLoading(false)
    setStarsVisuallyReady(false)
  }, [focusedPlanetId])

  // Callback when stars become visible (after vortex animation)
  const handleStarsReady = useCallback(() => {
    setStarsVisuallyReady(true)
  }, [])

  // Track when loading starts for current planet
  useEffect(() => {
    if (starsLoading && focusedPlanetId && !hasStartedLoading) {
      setHasStartedLoading(true)
    }
  }, [starsLoading, focusedPlanetId, hasStartedLoading])

  // Fetch stars based on mode
  useEffect(() => {
    if (focusedPlanetId) {
      fetchStarsByPlanet(focusedPlanetId)
    } else {
      fetchAllStars()
    }
  }, [focusedPlanetId, fetchStarsByPlanet, fetchAllStars])

  // Mark initial load as complete when loading finishes AFTER it started
  useEffect(() => {
    if (!starsLoading && hasStartedLoading && !initialLoadComplete) {
      setInitialLoadComplete(true)
    }
  }, [starsLoading, hasStartedLoading, initialLoadComplete])

  // Sync URL with state
  useEffect(() => {
    const urlPlanetId = searchParams.get('planet')
    if (urlPlanetId !== focusedPlanetId) {
      setFocusedPlanetId(urlPlanetId)
    }
  }, [searchParams, focusedPlanetId])

  // Handle star from URL - wait for stars to be visually ready, then delay before selecting
  useEffect(() => {
    if (starIdFromUrl && stars.length > 0 && starsVisuallyReady) {
      // Small delay after explosion before "clicking" the star
      const timer = setTimeout(() => {
        const star = stars.find((s) => s.id === starIdFromUrl)
        if (star) {
          setSelectedStar(star)
          markAsRead(star.id)
        }
      }, 800) // 0.8 second delay for natural feel

      return () => clearTimeout(timer)
    }
  }, [starIdFromUrl, stars, starsVisuallyReady, markAsRead])

  // Planet click - update URL with shallow routing
  const handlePlanetClick = useCallback((planet: Planet) => {
    playPlanetClick()
    setFocusedPlanetId(planet.id)
    // Shallow routing - doesn't trigger page reload
    window.history.pushState(null, '', `?planet=${planet.id}`)
  }, [playPlanetClick])

  // Back to universe - clear focused planet
  const handleBackToUniverse = useCallback(() => {
    setFocusedPlanetId(null)
    setSelectedStar(null)
    window.history.pushState(null, '', '/')
  }, [])

  // Star click
  const handleStarClick = useCallback((star: Star) => {
    playStarClick()
    setSelectedStar(star)
    markAsRead(star.id)
    // Mark that user has clicked a star (hides the hint prompt)
    if (!hasClickedStar) {
      setHasClickedStar(true)
      localStorage.setItem('duygu-evreni-star-clicked', 'true')
    }
  }, [markAsRead, hasClickedStar, playStarClick])

  const handleClosePanel = useCallback(() => {
    setSelectedStar(null)
  }, [])

  const handleStarCreated = useCallback((newStar: Star) => {
    playAddStar()
    if (focusedPlanetId) {
      fetchStarsByPlanet(focusedPlanetId)
    }
    // Refetch star counts to update universe view tooltips
    refetchCounts()
    // Focus camera on the newly created star
    setSelectedStar(newStar)
    markAsRead(newStar.id)
  }, [focusedPlanetId, fetchStarsByPlanet, refetchCounts, markAsRead, playAddStar])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const planetId = params.get('planet')
      setFocusedPlanetId(planetId)
      if (!planetId) {
        setSelectedStar(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const isInPlanetMode = !!focusedPlanetId

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#0A0E27] to-black">
      {/* Onboarding for first-time visitors */}
      {!isInPlanetMode && <Onboarding />}

      {/* Floating Header - Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 sm:top-6 left-2 sm:left-4 z-20"
      >
        <button
          onClick={isInPlanetMode ? handleBackToUniverse : undefined}
          className="flex items-center gap-0 group cursor-pointer"
        >
          <Image
            src="/logo.png"
            alt="Duygu Evreni"
            width={75}
            height={75}
            className="w-[55px] h-[55px] sm:w-[75px] sm:h-[75px]"
          />
          <span className="font-bold text-[15px] sm:text-[17px] -ml-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            Duygu Evreni
          </span>
        </button>
      </motion.div>

      {/* Floating Header - Auth Buttons & Music Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 sm:top-6 right-3 sm:right-6 z-20 flex items-center space-x-3 sm:space-x-4"
      >
        <MusicToggle />
        {authLoading ? (
          <div className="w-20 h-8 bg-white/10 rounded-lg animate-pulse" />
        ) : user ? (
          <>
            <Link
              href="/profil"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Profil
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Çıkış Yap
            </Button>
          </>
        ) : (
          <Link href="/giris">
            <Button variant="primary" size="sm">
              Giriş Yap
            </Button>
          </Link>
        )}
      </motion.div>

      {/* 3D Universe - Full screen */}
      <div className="absolute inset-0">
        {planetsLoading ? (
          <div className="w-full h-full flex items-center justify-center flex-col gap-4">
            <div className="text-white text-lg animate-pulse">
              Evren yükleniyor...
            </div>
            {planetsError && (
              <div className="text-red-400 text-sm">Hata: {planetsError}</div>
            )}
          </div>
        ) : planets.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center flex-col gap-4">
            <div className="text-white text-lg">Gezegen bulunamadı</div>
            {planetsError && <div className="text-red-400 text-sm">{planetsError}</div>}
          </div>
        ) : (
          <ErrorBoundary>
            <UnifiedUniverse
              planets={planets}
              stars={stars}
              focusedPlanetId={focusedPlanetId}
              onPlanetClick={handlePlanetClick}
              onStarClick={handleStarClick}
              onBackToUniverse={handleBackToUniverse}
              selectedStarId={selectedStar?.id}
              readStarIds={readStarIds}
              starCounts={starCounts}
              starsLoading={starsLoading && !initialLoadComplete}
              onStarsReady={handleStarsReady}
              isMobile={isMobile}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Universe mode UI */}
      <AnimatePresence>
        {!isInPlanetMode && !planetsLoading && planets.length > 0 && (
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

      {/* Planet mode UI */}
      <AnimatePresence>
        {isInPlanetMode && focusedPlanet && (
          <>
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={handleBackToUniverse}
              className="absolute top-24 left-4 z-20 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Evrene Dön</span>
            </motion.button>

            {/* Planet info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.2 }}
              className="absolute top-32 sm:top-36 left-3 sm:left-6 z-10"
            >
              <div className="glass rounded-lg sm:rounded-xl p-2.5 sm:p-4 max-w-[180px] sm:max-w-xs">
                <h1
                  className="text-base sm:text-xl font-bold mb-1 sm:mb-2"
                  style={{ color: focusedPlanet.color }}
                >
                  {focusedPlanet.name_tr}
                </h1>
                <p className="text-xs sm:text-sm text-white/60">{focusedPlanet.description_tr}</p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2">
                  {starCounts[focusedPlanetId] ?? stars.filter(s => s.planet_id === focusedPlanetId).length} yıldız
                </p>
              </div>
            </motion.div>

            {/* Share star button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
            >
              <Button
                variant="primary"
                size={isMobile ? 'md' : 'lg'}
                onClick={() => setIsModalOpen(true)}
                className="shadow-lg shadow-purple-500/25"
              >
                Yıldız Paylaş {isAdmin ? '(∞)' : `(${remainingStars} kaldı)`}
              </Button>
            </motion.div>

            {/* Hint prompt - only shows until user clicks their first star */}
            {!hasClickedStar && !selectedStar && stars.filter(s => s.planet_id === focusedPlanetId).length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 glass rounded-xl p-4 hidden md:block max-w-xs z-10"
              >
                <p className="text-sm text-white/60 text-center">
                  Bir yıldıza tıkla ve duyguyu oku
                </p>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Star view panel - only in planet mode */}
      {isInPlanetMode && focusedPlanet && (
        <StarViewPanel
          star={selectedStar}
          onClose={handleClosePanel}
          planetColor={focusedPlanet.color}
        />
      )}

      {/* Star creation modal */}
      {focusedPlanet && (
        <StarCreationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          planet={focusedPlanet}
          onSuccess={handleStarCreated}
        />
      )}
    </div>
  )
}

// Main export with Suspense boundary for useSearchParams
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black">
        <div className="text-white text-lg animate-pulse">Evren yükleniyor...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
