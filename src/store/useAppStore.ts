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

export interface FiltersState {
  city: string
  district: string
  gender: string
  ageFrom: string
  ageTo: string
  rooms: string
  peopleCount: string
  searchingCount: string
  canLiveWith: string
  deposit: string
  contract: string
  priceFrom: string
  priceTo: string
  onlyPhotos: boolean
  hideViewed: boolean
  term: string
}

const initialApartmentFilters: FiltersState = {
  city: '',
  district: 'Не важно',
  gender: 'Не важно',
  ageFrom: '',
  ageTo: '',
  rooms: 'Не важно',
  peopleCount: 'Не важно',
  searchingCount: 'Не важно',
  canLiveWith: 'Не важно',
  deposit: 'Не важно',
  contract: 'Не важно',
  priceFrom: '',
  priceTo: '',
  onlyPhotos: false,
  hideViewed: false,
  term: 'Не важно',
}

const initialRoommateFilters: FiltersState = {
  city: '',
  district: '-',
  gender: 'Не важно',
  ageFrom: '',
  ageTo: '',
  rooms: 'Не важно',
  peopleCount: 'Не важно',
  searchingCount: 'Не важно',
  canLiveWith: 'Не важно',
  deposit: 'Не важно',
  contract: 'Не важно',
  priceFrom: '',
  priceTo: '',
  onlyPhotos: false,
  hideViewed: false,
  term: 'Не важно',
}

interface AppState {
  theme: 'light' | 'dark'
  mode: 'apartment' | 'roommate'
  user: Profile | null
  favorites: string[] // Array of listing IDs
  apartmentListings: Listing[]
  roommateListings: Listing[]
  viewed: string[] // Array of listing IDs
  favoritesListings: Listing[]
  viewedListings: Listing[]
  userListings: Listing[]
  hasFetchedApartments: boolean
  hasFetchedRoommates: boolean
  hasFetchedUserListings: boolean
  filters: FiltersState
  apartmentFilters: FiltersState
  roommateFilters: FiltersState
  setTheme: (theme: 'light' | 'dark') => void
  setMode: (mode: 'apartment' | 'roommate') => void
  setUser: (user: Profile | null) => void
  toggleFavorite: (listingId: string) => void
  addToViewed: (listingId: string) => void
  setApartmentListings: (listings: Listing[]) => void
  setRoommateListings: (listings: Listing[]) => void
  setFavoritesListings: (listings: Listing[]) => void
  setViewedListings: (listings: Listing[]) => void
  setUserListings: (listings: Listing[]) => void
  setHasFetchedApartments: (val: boolean) => void
  setHasFetchedRoommates: (val: boolean) => void
  setHasFetchedUserListings: (val: boolean) => void
  clearFavorites: () => void
  clearViewed: () => void
  setFilters: (filters: Partial<FiltersState>) => void
  resetFilters: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      mode: 'apartment',
      user: null,
      favorites: [],
      apartmentListings: [],
      roommateListings: [],
      viewed: [],
      favoritesListings: [],
      viewedListings: [],
      userListings: [],
      hasFetchedApartments: false,
      hasFetchedRoommates: false,
      hasFetchedUserListings: false,
      filters: { ...initialApartmentFilters },
      apartmentFilters: { ...initialApartmentFilters },
      roommateFilters: { ...initialRoommateFilters },
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
      setMode: (mode) => set((state) => {
        // Save current filters to the previous mode
        const prevMode = state.mode
        const savedFilters = { ...state.filters }
        
        const newApartmentFilters = prevMode === 'apartment' ? savedFilters : state.apartmentFilters
        const newRoommateFilters = prevMode === 'roommate' ? savedFilters : state.roommateFilters
        
        // Load new active filters
        const activeFilters = mode === 'apartment' ? newApartmentFilters : newRoommateFilters
        
        return {
          mode,
          apartmentFilters: newApartmentFilters,
          roommateFilters: newRoommateFilters,
          filters: activeFilters
        }
      }),
      setUser: (user) => set((state) => {
        if (!user) {
          return { user: null, userListings: [], hasFetchedUserListings: false }
        }
        return { user }
      }),
      toggleFavorite: (listingId) =>
        set((state) => {
          const isFav = state.favorites.includes(listingId)
          const newFavs = isFav
            ? state.favorites.filter((id) => id !== listingId)
            : [...state.favorites, listingId]
          const newFavListings = isFav
            ? state.favoritesListings.filter((item) => item.id !== listingId)
            : state.favoritesListings
          return { favorites: newFavs, favoritesListings: newFavListings }
        }),
      addToViewed: (listingId) =>
        set((state) => {
          const filtered = state.viewed.filter((id) => id !== listingId)
          // Keep only the last 30 viewed items, with the most recent at the front
          const newViewed = [listingId, ...filtered].slice(0, 30)
          return { viewed: newViewed }
        }),
      setApartmentListings: (listings) => set({ apartmentListings: listings }),
      setRoommateListings: (listings) => set({ roommateListings: listings }),
      setFavoritesListings: (listings) => set({ favoritesListings: listings }),
      setViewedListings: (listings) => set({ viewedListings: listings }),
      setUserListings: (listings) => set({ userListings: listings }),
      setHasFetchedApartments: (val) => set({ hasFetchedApartments: val }),
      setHasFetchedRoommates: (val) => set({ hasFetchedRoommates: val }),
      setHasFetchedUserListings: (val) => set({ hasFetchedUserListings: val }),
      clearFavorites: () => set({ favorites: [], favoritesListings: [] }),
      clearViewed: () => set({ viewed: [], viewedListings: [] }),
      setFilters: (updated) => set((state) => {
        const newFilters = { ...state.filters, ...updated }
        if (state.mode === 'apartment') {
          return { filters: newFilters, apartmentFilters: newFilters }
        } else {
          return { filters: newFilters, roommateFilters: newFilters }
        }
      }),
      resetFilters: () => set((state) => {
        const initial = state.mode === 'apartment' ? initialApartmentFilters : initialRoommateFilters
        const defaultDistrict = state.mode === 'apartment' ? 'Не важно' : '-'
        const resetObj = {
          ...initial,
          district: defaultDistrict
        }
        if (state.mode === 'apartment') {
          return { filters: resetObj, apartmentFilters: resetObj }
        } else {
          return { filters: resetObj, roommateFilters: resetObj }
        }
      }),
    }),
    {
      name: 'baspana-kz-storage',
      partialize: (state) => ({
        theme: state.theme,
        mode: state.mode,
        favorites: state.favorites,
        viewed: state.viewed,
        user: state.user,
        filters: state.filters,
        apartmentFilters: state.apartmentFilters,
        roommateFilters: state.roommateFilters,
      }),
    }
  )
)
