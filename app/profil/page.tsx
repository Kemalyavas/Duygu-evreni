'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Navbar, Card, Button, NotificationList } from '@/components/ui'
import { BlackHoleContact } from '@/components/BlackHoleContact'
import { DonutChart, StarListItem } from '@/components/profile'
import { PendingRequestsList, ConversationList, ChatPanel } from '@/components/messaging'
import { useAuth, usePlanets, useDailyLimit, useConversations, useNotifications } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/client'

interface PlanetStats {
  planet_id: string
  planet_name: string
  planet_color: string
  count: number
}

interface UserStar {
  id: string
  content: string
  planet_id: string
  planet_name: string
  planet_color: string
  created_at: string
}

const STARS_PER_PAGE = 10

export default function ProfilPage() {
  const router = useRouter()
  const { user, profile, setProfile, signOut } = useAuth()
  const { planets } = usePlanets()
  const { remainingStars, maxStars } = useDailyLimit()
  const {
    pendingRequests,
    conversations,
    pendingCount,
    fetchPendingRequests,
    fetchConversations,
  } = useConversations()
  const { notifications, unreadCount } = useNotifications()

  const [stats, setStats] = useState<PlanetStats[]>([])
  const [totalStars, setTotalStars] = useState(0)
  const [loading, setLoading] = useState(true)

  // New states
  const [userStars, setUserStars] = useState<UserStar[]>([])
  const [displayedStars, setDisplayedStars] = useState<UserStar[]>([])
  const [selectedStarId, setSelectedStarId] = useState<string | null>(null)
  const [firstStarDate, setFirstStarDate] = useState<string | null>(null)
  const [dominantEmotion, setDominantEmotion] = useState<PlanetStats | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [privacyLoading, setPrivacyLoading] = useState(false)

  // Fetch user's star statistics and full star data
  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      const supabase = createClient()

      try {
        // Get full star data including content and created_at
        const { data, error } = await supabase
          .from('stars')
          .select('id, content, planet_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Count by planet
        const countByPlanet: Record<string, number> = {}
        data.forEach((star: { planet_id: string }) => {
          countByPlanet[star.planet_id] = (countByPlanet[star.planet_id] || 0) + 1
        })

        // Map to stats with planet info
        const planetStats: PlanetStats[] = planets
          .map((planet) => ({
            planet_id: planet.id,
            planet_name: planet.name_tr,
            planet_color: planet.color,
            count: countByPlanet[planet.id] || 0,
          }))
          .filter((stat) => stat.count > 0)
          .sort((a, b) => b.count - a.count)

        setStats(planetStats)
        setTotalStars(data.length)

        // Set dominant emotion (highest count)
        if (planetStats.length > 0) {
          setDominantEmotion(planetStats[0])
        }

        // Map stars with planet info
        const starsWithPlanetInfo: UserStar[] = data.map((star: { id: string; content: string; planet_id: string; created_at: string }) => {
          const planet = planets.find(p => p.id === star.planet_id)
          return {
            id: star.id,
            content: star.content,
            planet_id: star.planet_id,
            planet_name: planet?.name_tr || 'Bilinmeyen',
            planet_color: planet?.color || '#888888',
            created_at: star.created_at,
          }
        })

        setUserStars(starsWithPlanetInfo)
        setDisplayedStars(starsWithPlanetInfo.slice(0, STARS_PER_PAGE))
        setHasMore(starsWithPlanetInfo.length > STARS_PER_PAGE)

        // Find first star date (oldest)
        if (data.length > 0) {
          const oldestStar = data[data.length - 1]
          setFirstStarDate(oldestStar.created_at)
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    if (planets.length > 0) {
      fetchStats()
    }
  }, [user, planets])

  // Fetch messaging data
  useEffect(() => {
    if (user) {
      fetchPendingRequests()
      fetchConversations()
    }
  }, [user, fetchPendingRequests, fetchConversations])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleLoadMore = () => {
    const currentCount = displayedStars.length
    const nextStars = userStars.slice(0, currentCount + STARS_PER_PAGE)
    setDisplayedStars(nextStars)
    setHasMore(nextStars.length < userStars.length)
  }

  const handleStarClick = (star: UserStar) => {
    setSelectedStarId(star.id)
    // Brief delay for visual feedback, then navigate
    setTimeout(() => {
      router.push(`/?planet=${star.planet_id}&star=${star.id}`)
    }, 300)
  }

  const handlePrivacyToggle = async () => {
    if (!user || !profile || privacyLoading) return

    try {
      setPrivacyLoading(true)
      const newValue = !profile.show_username_in_chats
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({ show_username_in_chats: newValue })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setProfile({ ...profile, show_username_in_chats: newValue })
    } catch (err) {
      console.error('Failed to update privacy setting:', err)
    } finally {
      setPrivacyLoading(false)
    }
  }

  // Prepare chart data
  const chartData = stats.map(stat => ({
    label: stat.planet_name,
    value: stat.count,
    color: stat.planet_color,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black">
      <Navbar />

      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
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
          </button>

          {/* Profile header */}
          <Card>
            <div>
              <h1 className="text-xl font-bold text-white">{profile?.username || 'Profilim'}</h1>
              <p className="text-white/50 text-sm mt-1">{user?.email}</p>
            </div>
          </Card>

          {/* Most Shared Emotion - NEW */}
          {!loading && dominantEmotion && totalStars > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${dominantEmotion.planet_color}15`,
                      boxShadow: `0 0 30px ${dominantEmotion.planet_color}20`
                    }}
                  >
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">En çok paylaştığım duygu</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: dominantEmotion.planet_color }}
                    >
                      {dominantEmotion.planet_name}
                    </p>
                  </div>
                </div>
                <p className="text-white/40 text-sm mt-3">
                  {dominantEmotion.count} yıldız ile en çok {dominantEmotion.planet_name.toLowerCase()} paylaşıyorsun
                </p>
              </Card>
            </motion.div>
          )}

          {/* Donut Chart - NEW */}
          {!loading && totalStars > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6 text-center">
                  Duygu Dağılımı
                </h2>
                <DonutChart data={chartData} />
              </Card>
            </motion.div>
          )}

          {/* Daily limit card */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">
              Günlük Limit
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Bugün paylaşabileceğin</span>
                <span className="text-white font-medium">
                  {remainingStars} / {maxStars} yıldız
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((maxStars - remainingStars) / maxStars) * 100}%`,
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                />
              </div>
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">
              Gizlilik Ayarları
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/80 text-sm">Sohbetlerde kullanıcı adım gözüksün</p>
                <p className="text-white/40 text-xs mt-1">
                  Kapalıysa sohbetlerde &ldquo;Anonim&rdquo; olarak görünürsün
                </p>
              </div>
              <button
                onClick={handlePrivacyToggle}
                disabled={privacyLoading}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  profile?.show_username_in_chats !== false
                    ? 'bg-cyan-500'
                    : 'bg-white/20'
                } ${privacyLoading ? 'opacity-50' : ''}`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    profile?.show_username_in_chats !== false
                      ? 'left-6'
                      : 'left-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Bildirimler */}
          {notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Bildirimler
                  </h2>
                  {unreadCount > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-medium">
                      {unreadCount} yeni
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <NotificationList showHeader={false} />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Pending Message Requests */}
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Mesaj İstekleri
                  </h2>
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-medium">
                    {pendingCount}
                  </span>
                </div>
                <PendingRequestsList
                  requests={pendingRequests}
                  onRespond={fetchPendingRequests}
                />
              </Card>
            </motion.div>
          )}

          {/* Active Conversations */}
          {conversations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Sohbetlerim
                </h2>
                <ConversationList conversations={conversations} />
              </Card>
            </motion.div>
          )}

          {/* First Star Date - NEW */}
          {!loading && firstStarDate && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-white/40 text-sm py-2"
            >
              Bu evrende ilk yıldızını{' '}
              <span className="text-white/60">
                {format(new Date(firstStarDate), "d MMMM yyyy'te", { locale: tr })}
              </span>{' '}
              paylaştın
            </motion.p>
          )}

          {/* My Stars Section - NEW */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">
                Yıldızlarım
              </h2>

              {loading ? (
                <div className="py-8 text-center">
                  <p className="text-white/40 animate-pulse">Yükleniyor...</p>
                </div>
              ) : displayedStars.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {displayedStars.map((star, index) => (
                      <motion.div
                        key={star.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <StarListItem
                          star={star}
                          isSelected={selectedStarId === star.id}
                          onClick={() => handleStarClick(star)}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {hasMore && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleLoadMore}
                      className="w-full mt-4"
                    >
                      Daha fazla göster
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-white/40 text-center py-8">
                  Henüz yıldız paylaşmadın
                </p>
              )}
            </Card>
          </motion.div>

          {/* Logout button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleLogout}
            className="w-full"
          >
            Çıkış Yap
          </Button>

          {/* Black Hole Contact - Easter egg */}
          <BlackHoleContact />

          {/* Privacy link */}
          <div className="text-center pt-4 pb-2">
            <a
              href="/gizlilik"
              className="text-white/50 hover:text-white hover:underline text-xs transition-all"
            >
              Gizlilik Politikası
            </a>
          </div>
        </motion.div>
      </div>

      {/* Chat Panel - Global */}
      <ChatPanel />
    </div>
  )
}
