import { create } from 'zustand'
import type { Planet, Star, Profile, ConversationWithDetails } from '@/types'

interface AppState {
  // User state
  user: { id: string; email: string } | null
  profile: Profile | null
  setUser: (user: { id: string; email: string } | null) => void
  setProfile: (profile: Profile | null) => void

  // Selected states
  selectedPlanet: Planet | null
  selectedStar: Star | null
  setSelectedPlanet: (planet: Planet | null) => void
  setSelectedStar: (star: Star | null) => void

  // Modal states
  isStarModalOpen: boolean
  setStarModalOpen: (open: boolean) => void

  // View state
  isViewingStars: boolean
  setViewingStars: (viewing: boolean) => void

  // Messaging state
  activeConversation: ConversationWithDetails | null
  setActiveConversation: (conversation: ConversationWithDetails | null) => void
  isMessagingPanelOpen: boolean
  setMessagingPanelOpen: (open: boolean) => void
  isChatCompact: boolean
  setChatCompact: (compact: boolean) => void
  isMessageRequestModalOpen: boolean
  setMessageRequestModalOpen: (open: boolean) => void
  pendingRequestsCount: number
  setPendingRequestsCount: (count: number) => void
  unreadMessagesCount: number
  setUnreadMessagesCount: (count: number) => void
}

export const useStore = create<AppState>((set) => ({
  // User state
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  // Selected states
  selectedPlanet: null,
  selectedStar: null,
  setSelectedPlanet: (planet) => set({ selectedPlanet: planet }),
  setSelectedStar: (star) => set({ selectedStar: star }),

  // Modal states
  isStarModalOpen: false,
  setStarModalOpen: (open) => set({ isStarModalOpen: open }),

  // View state
  isViewingStars: false,
  setViewingStars: (viewing) => set({ isViewingStars: viewing }),

  // Messaging state
  activeConversation: null,
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  isMessagingPanelOpen: false,
  setMessagingPanelOpen: (open) => set({ isMessagingPanelOpen: open }),
  isChatCompact: false,
  setChatCompact: (compact) => set({ isChatCompact: compact }),
  isMessageRequestModalOpen: false,
  setMessageRequestModalOpen: (open) => set({ isMessageRequestModalOpen: open }),
  pendingRequestsCount: 0,
  setPendingRequestsCount: (count) => set({ pendingRequestsCount: count }),
  unreadMessagesCount: 0,
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),
}))
