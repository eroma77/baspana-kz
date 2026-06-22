import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Profile {
  id: string
  email: string
  avatar_url?: string
  created_at?: string
}

export interface Listing {
  id: string
  owner_id: string
  mode: 'apartment' | 'roommate'
  city: string
  district?: string | null
  gender: string
  age_from: number
  age_to: number
  rooms: string
  can_live_with?: string | null
  people_count: number
  searching_count: number
  term: string
  total_people: number
  deposit: number
  contract: 'yes' | 'no'
  price_from: number
  price_to: number
  photos: string[]
  description: string
  phone: string
  address_link?: string | null
  is_premium: boolean
  premium_until?: string | null
  status: 'active' | 'inactive' | 'pending_receipt' | 'receipt_error'
  transaction_id?: string | null
  receipt_url?: string | null
  created_at: string
  updated_at: string
}

interface AppState {
  theme: 'light' | 'dark'
  mode: 'apartment' | 'roommate'
  user: Profile | null
  favorites: string[] // Array of listing IDs
  listings: Listing[]
  viewed: string[] // Array of listing IDs
  setTheme: (theme: 'light' | 'dark') => void
  setMode: (mode: 'apartment' | 'roommate') => void
  setUser: (user: Profile | null) => void
  toggleFavorite: (listingId: string) => void
  addToViewed: (listingId: string) => void
  setListings: (listings: Listing[]) => void
  clearFavorites: () => void
  clearViewed: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      mode: 'apartment',
      user: null,
      favorites: [],
      listings: [],
      viewed: [],
      setTheme: (theme) => {
        set({ theme })
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },
      setMode: (mode) => set({ mode }),
      setUser: (user) => set({ user }),
      toggleFavorite: (listingId) =>
        set((state) => {
          const isFav = state.favorites.includes(listingId)
          const newFavs = isFav
            ? state.favorites.filter((id) => id !== listingId)
            : [...state.favorites, listingId]
          return { favorites: newFavs }
        }),
      addToViewed: (listingId) =>
        set((state) => {
          const filtered = state.viewed.filter((id) => id !== listingId)
          // Keep only the last 30 viewed items, with the most recent at the front
          const newViewed = [listingId, ...filtered].slice(0, 30)
          return { viewed: newViewed }
        }),
      setListings: (listings) => set({ listings }),
      clearFavorites: () => set({ favorites: [] }),
      clearViewed: () => set({ viewed: [] }),
    }),
    {
      name: 'baspana-kz-storage',
      partialize: (state) => ({
        theme: state.theme,
        mode: state.mode,
        favorites: state.favorites,
        viewed: state.viewed,
        user: state.user,
      }),
    }
  )
)
