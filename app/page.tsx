'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, ErrorBoundary, MusicToggle, NotificationPanel, LanguageSwitcher } from '@/components/ui'
import { useTranslation } from '@/lib/i18n'
import { Onboarding } from '@/components/Onboarding'
import { StarCreationModal } from '@/components/StarCreationModal'
import { StarViewPanel } from '@/components/StarViewPanel'
import { MessageRequestModal } from '@/components/messaging'
import { useAuth, usePlanets, useStars, useStarCounts, useDailyLimit, useReadStars, useMobile, useSoundEffects } from '@/lib/hooks'
import type { Planet, Star } from '@/types'
import { HomeSeoLinks } from '@/components/home/HomeSeoLinks'

// Static star positions for loading screen (avoids hydration mismatch)
const LOADER_STARS = [
  { left: '10%', top: '20%', delay: '0s', opacity: 0.3 },
  { left: '85%', top: '15%', delay: '0.5s', opacity: 0.5 },
  { left: '25%', top: '80%', delay: '1s', opacity: 0.4 },
  { left: '70%', top: '60%', delay: '0.3s', opacity: 0.6 },
  { left: '45%', top: '10%', delay: '1.5s', opacity: 0.3 },
  { left: '90%', top: '85%', delay: '0.8s', opacity: 0.5 },
  { left: '5%', top: '50%', delay: '1.2s', opacity: 0.4 },
  { left: '60%', top: '30%', delay: '0.2s', opacity: 0.7 },
  { left: '30%', top: '45%', delay: '1.8s', opacity: 0.3 },
  { left: '75%', top: '90%', delay: '0.6s', opacity: 0.5 },
  { left: '15%', top: '70%', delay: '1.1s', opacity: 0.4 },
  { left: '50%', top: '5%', delay: '0.4s', opacity: 0.6 },
]

// Branded loading component for 3D scene
function UniverseLoader() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {LOADER_STARS.map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      {/* Logo and loading text */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full animate-spin opacity-30 blur-xl" />
          <img
            src="/logo.png"
            alt="Duygu Evreni"
            className="w-20 h-20 relative z-10 animate-pulse"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-white/80 text-sm font-medium">Evren yükleniyor...</p>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Shown when planets fail to load (instead of an infinite loader)
function UniverseError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black text-center px-6">
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm">
        <img src="/logo.png" alt="Duygu Evreni" className="w-16 h-16 opacity-80" />
        <p className="text-white/80 text-base font-medium">Evren yüklenemedi</p>
        <p className="text-white/50 text-sm">
          Gezegenler yüklenirken bir sorun oluştu. Lütfen tekrar dene.
        </p>
        <button
          onClick={onRetry}
          className="mt-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}

// Dynamic import for 3D component (client-side only)
const UnifiedUniverse = dynamic(
  () => import('@/components/3d/UnifiedUniverse').then((mod) => mod.UnifiedUniverse),
  {
    ssr: false,
    loading: () => <UniverseLoader />,
  }
)

// Wrapper component to handle useSearchParams with Suspense
function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planetIdFromUrl = searchParams.get('planet')
  const starIdFromUrl = searchParams.get('star')
  const { t, language } = useTranslation()

  const { user, profile, isLoading: authLoading, signOut } = useAuth()

  // Redirect to username setup if logged in but no username
  useEffect(() => {
    if (!authLoading && user && profile && !profile.username) {
      router.replace('/kullanici-adi')
    }
  }, [authLoading, user, profile, router])
  const { planets, loading: planetsLoading, error: planetsError, refetch: refetchPlanets } = usePlanets()
  const { stars, loading: starsLoading, fetchAllStars, fetchStarsByPlanet } = useStars()
  const { starCounts, refetchCounts } = useStarCounts()
  const { remainingStars, isAdmin, incrementViewCount, checkRealLimit } = useDailyLimit()
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
  const [isNavigatingToStar, setIsNavigatingToStar] = useState(false) // Track star navigation animation

  // Keşfet için son ziyaret edilen yıldızları tutan ref (tekrar gitmeyi önlemek için)
  const recentlyExploredStarsRef = useRef<string[]>([])

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
    // Only play sound when entering planet from universe view (not when already in planet)
    if (!focusedPlanetId) {
      playPlanetClick()
    }
    setFocusedPlanetId(planet.id)
    // Gezegen değiştiğinde keşfet history'sini sıfırla
    recentlyExploredStarsRef.current = []
    // Shallow routing - doesn't trigger page reload
    window.history.pushState(null, '', `?planet=${planet.id}`)
  }, [playPlanetClick, focusedPlanetId])

  // Back to universe - clear focused planet
  const handleBackToUniverse = useCallback(() => {
    setFocusedPlanetId(null)
    setSelectedStar(null)
    // Keşfet history'sini sıfırla
    recentlyExploredStarsRef.current = []
    window.history.pushState(null, '', '/')
  }, [])

  // Star click
  const handleStarClick = useCallback((star: Star) => {
    playStarClick()
    setSelectedStar(star)
    markAsRead(star.id)
    incrementViewCount() // Track view for statistics
    // Mark that user has clicked a star (hides the hint prompt)
    if (!hasClickedStar) {
      setHasClickedStar(true)
      localStorage.setItem('duygu-evreni-star-clicked', 'true')
    }
  }, [markAsRead, hasClickedStar, playStarClick, incrementViewCount])

  // Akıllı keşfet - önce okunmamış yıldızlara git, aynı yıldızlara tekrar gitme
  const handleRandomStar = useCallback(() => {
    if (isNavigatingToStar) return // Prevent spam clicking

    const planetStars = stars.filter(s => s.planet_id === focusedPlanetId)
    if (planetStars.length === 0) return

    // Start navigation lock
    setIsNavigatingToStar(true)

    // If only one star exists, just select it
    if (planetStars.length === 1) {
      handleStarClick(planetStars[0])
      setTimeout(() => setIsNavigatingToStar(false), 1400)
      return
    }

    // Şu an seçili yıldızın ID'si (aynı yıldıza gitmeyi önlemek için)
    const currentStarId = selectedStar?.id

    // Okunmamış yıldızları bul (parlak olanlar)
    const unreadStars = planetStars.filter(s => !readStarIds.has(s.id))

    // Son ziyaret edilen yıldızlar (bu oturumda keşfetle gidilenler)
    const recentlyExplored = recentlyExploredStarsRef.current

    let candidateStars: Star[]

    if (unreadStars.length > 0) {
      // Okunmamış yıldız varsa, öncelik onlara
      // Son ziyaret edilenleri ve şu anki yıldızı çıkar
      candidateStars = unreadStars.filter(s => !recentlyExplored.includes(s.id) && s.id !== currentStarId)

      // Tüm okunmamışlar son ziyaretlilerdeyse, listeyi sıfırla ve tekrar dene
      if (candidateStars.length === 0) {
        recentlyExploredStarsRef.current = []
        // Sadece şu anki yıldızı hariç tut
        candidateStars = unreadStars.filter(s => s.id !== currentStarId)
      }
    } else {
      // Okunmamış yıldız yoksa, tüm yıldızlardan seç
      // Son ziyaret edilenleri ve şu anki yıldızı çıkar
      candidateStars = planetStars.filter(s => !recentlyExplored.includes(s.id) && s.id !== currentStarId)

      // Tüm yıldızlar son ziyaretlilerdeyse, listeyi sıfırla ve tekrar dene
      if (candidateStars.length === 0) {
        recentlyExploredStarsRef.current = []
        // Sadece şu anki yıldızı hariç tut
        candidateStars = planetStars.filter(s => s.id !== currentStarId)
      }
    }

    // Rastgele bir yıldız seç
    const randomIndex = Math.floor(Math.random() * candidateStars.length)
    const randomStar = candidateStars[randomIndex]

    // Seçilen yıldızı son ziyaret edilenlere ekle
    recentlyExploredStarsRef.current = [...recentlyExploredStarsRef.current, randomStar.id]

    // Maksimum 10 yıldız tut (çok büyümesini önle)
    if (recentlyExploredStarsRef.current.length > 10) {
      recentlyExploredStarsRef.current = recentlyExploredStarsRef.current.slice(-10)
    }

    handleStarClick(randomStar)

    // Release lock after animation completes
    setTimeout(() => {
      setIsNavigatingToStar(false)
    }, 1400)
  }, [stars, focusedPlanetId, handleStarClick, readStarIds, isNavigatingToStar, selectedStar])

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
    // Refresh the daily-limit counter so the "remaining" badge updates immediately
    checkRealLimit()
    // Focus camera on the newly created star
    setSelectedStar(newStar)
    markAsRead(newStar.id)
  }, [focusedPlanetId, fetchStarsByPlanet, refetchCounts, markAsRead, playAddStar, checkRealLimit])

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
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#0A0E27] to-black">
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
            alt={t('home.title')}
            width={75}
            height={75}
            priority
            className="w-[55px] h-[55px] sm:w-[75px] sm:h-[75px]"
          />
          <span className="font-bold text-[15px] sm:text-[17px] -ml-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            {t('home.title')}
          </span>
        </button>
      </motion.div>

      {/* Floating Header - Auth Buttons & Music Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 sm:top-6 right-3 sm:right-6 z-20 flex items-center space-x-2 sm:space-x-3"
      >
        <Link
          href="/hakkinda"
          className="hidden sm:inline-flex text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Hakkında
        </Link>
        <LanguageSwitcher />
        <MusicToggle />
        {user && <NotificationPanel />}
        {authLoading ? (
          <div className="w-20 h-8 bg-white/10 rounded-lg animate-pulse" />
        ) : user ? (
          <>
            <Link
              href="/profil"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              {t('nav.profile')}
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              {t('auth.logout')}
            </Button>
          </>
        ) : (
          <Link href="/giris">
            <Button variant="primary" size="sm">
              {t('auth.login')}
            </Button>
          </Link>
        )}
      </motion.div>

      {/* 3D Universe - Full screen */}
      <div className="absolute inset-0">
        {planetsError && planets.length === 0 ? (
          <UniverseError onRetry={refetchPlanets} />
        ) : planetsLoading || planets.length === 0 ? (
          <UniverseLoader />
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
              {t('universe.selectPlanet')}
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
              <span>{t('universe.backToUniverse')}</span>
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
                <h2
                  className="text-base sm:text-xl font-bold mb-1 sm:mb-2"
                  style={{ color: focusedPlanet.color }}
                >
                  {language === 'tr' ? focusedPlanet.name_tr : (focusedPlanet.name_en || focusedPlanet.name_tr)}
                </h2>
                <p className="text-xs sm:text-sm text-white/60">
                  {language === 'tr' ? focusedPlanet.description_tr : (focusedPlanet.description_en || focusedPlanet.description_tr)}
                </p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1 sm:mt-2">
                  {starCounts[focusedPlanetId] ?? stars.filter(s => s.planet_id === focusedPlanetId).length} {language === 'tr' ? 'yıldız' : 'stars'}
                </p>
              </div>
            </motion.div>

            {/* Bottom action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3"
            >
              {/* Random star button - only show if there are stars */}
              {stars.filter(s => s.planet_id === focusedPlanetId).length > 0 && (
                <Button
                  variant="secondary"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={handleRandomStar}
                  disabled={isNavigatingToStar}
                  className="shadow-lg"
                >
                  <span className="flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    {t('universe.explore')}
                  </span>
                </Button>
              )}
              {/* Share star button */}
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => setIsModalOpen(true)}
                className="shadow-lg shadow-purple-500/25"
              >
                {t('universe.shareStar')} {user ? (isAdmin ? '(∞)' : `(${remainingStars} ${t('universe.starsRemaining')})`) : ''}
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
                  {t('universe.clickStarHint')}
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

      {/* Message Request Modal */}
      <MessageRequestModal />

      {/* Chat Panel is mounted once globally in Providers (avoids duplicate realtime subscriptions) */}
    </div>
  )
}

// Main export with Suspense boundary for useSearchParams
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<UniverseLoader />}>
        <HomePageContent />
      </Suspense>
      {/* Ana sayfa saf 3D evren olarak kalır. Bu sr-only blok 3D'yi bozmadan
          arama motorlarına H1 + iç linkler (gezegenler + /hakkinda) sağlar.
          Görünür tanıtım içeriği /hakkinda sayfasında. Suspense DIŞINDA. */}
      <HomeSeoLinks />
    </>
  )
}
