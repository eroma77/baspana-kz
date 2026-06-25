'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, X, Camera, Eye, SlidersHorizontal } from 'lucide-react'
import { SortIcon, SunIcon, MoonIcon, HelpIcon } from '@/components/icons'

// Formatting helper for budgets (spaces as thousands separators)
function formatBudgetDisplay(val: string) {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function FeedPage() {
  const router = useRouter()
  const { 
    mode, 
    viewed, 
    theme, 
    setTheme, 
    apartmentListings, 
    roommateListings, 
    setApartmentListings, 
    setRoommateListings,
    filters,
    hasFetchedApartments,
    hasFetchedRoommates,
    setHasFetchedApartments,
    setHasFetchedRoommates
  } = useAppStore()
  
  const listings = mode === 'apartment' ? apartmentListings : roommateListings
  
  // Data States
  const hasFetched = mode === 'apartment' ? hasFetchedApartments : hasFetchedRoommates
  const [isLoading, setIsLoading] = useState(!hasFetched)
  const [prevMode, setPrevMode] = useState(mode)

  if (mode !== prevMode) {
    setPrevMode(mode)
    const hasFetchedCurrent = mode === 'apartment' ? hasFetchedApartments : hasFetchedRoommates
    setIsLoading(!hasFetchedCurrent)
  }

  // Modal Toggles
  const [showSort, setShowSort] = useState(false)

  // Request counter ref to prevent race conditions
  const fetchCounter = useRef(0)

  // Sort State
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest')

  // Active City districts matrix
  const currentCityData = CITIES_DATA.find((c) => c.city === filters.city)
  const hasDistricts = currentCityData && currentCityData.districts.length > 0

  // Prefetch instruction and filter page for instant load
  useEffect(() => {
    router.prefetch('/instruction')
    router.prefetch('/filter')
  }, [router])

  const fetchListings = useCallback(async () => {
    const fetchId = ++fetchCounter.current
    const storeState = useAppStore.getState()
    const hasFetchedCurrent = mode === 'apartment' ? storeState.hasFetchedApartments : storeState.hasFetchedRoommates
    if (!hasFetchedCurrent) {
      setIsLoading(true)
    }
    try {
      // Call remote self-cleaning function
      await supabase.rpc('cleanup_listings')
      if (fetchId !== fetchCounter.current) return

      // Build database query
      let query = supabase
        .from('listings')
        .select('*')
        .eq('mode', mode === 'apartment' ? 'roommate' : 'apartment')
        .eq('status', 'active')

      // Apply DB filters
      if (filters.city) {
        query = query.eq('city', filters.city)
      }
      if (hasDistricts && filters.district !== 'Не важно' && filters.district !== '-') {
        query = query.eq('district', filters.district)
      }
      if (filters.gender && filters.gender !== 'Не важно') {
        if (filters.gender === 'Парень') {
          query = query.in('gender', ['Парень', 'мужской', 'Только парни'])
        } else if (filters.gender === 'Девушка') {
          query = query.in('gender', ['Девушка', 'женский', 'Только девочки'])
        } else {
          query = query.eq('gender', filters.gender)
        }
      }
      if (filters.rooms && filters.rooms !== 'Не важно') {
        const legacyRooms = filters.rooms.replace('-комнатный', '').replace('+-комнатный', '+')
        query = query.in('rooms', [filters.rooms, legacyRooms])
      }
      if (filters.deposit === 'Есть') {
        query = query.gt('deposit', 0)
      } else if (filters.deposit === 'Нет') {
        query = query.eq('deposit', 0)
      }
      if (filters.contract === 'Есть') {
        query = query.eq('contract', 'yes')
      } else if (filters.contract === 'Нет') {
        query = query.eq('contract', 'no')
      }
      if (filters.canLiveWith && filters.canLiveWith !== 'Не важно') {
        query = query.eq('can_live_with', filters.canLiveWith)
      }
      if (filters.term && filters.term !== 'Не важно') {
        query = query.eq('term', filters.term)
      }

      // Budget Ranges
      if (filters.priceFrom) {
        query = query.gte('price_from', parseInt(filters.priceFrom.replace(/\D/g, '')) || 0)
      }
      if (filters.priceTo) {
        query = query.lte('price_from', parseInt(filters.priceTo.replace(/\D/g, '')) || 0)
      }

      const { data, error } = await query
      if (error) throw error
      if (fetchId !== fetchCounter.current) return

      let result = (data as Listing[]) || []

      // Client-side post filtering
      if (mode === 'apartment') {
        if (filters.ageFrom && filters.ageFrom !== 'Не важно') {
          const ageVal = parseInt(filters.ageFrom.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.age_from <= ageVal && item.age_to >= ageVal)
        }
      } else {
        if (filters.ageFrom && filters.ageFrom !== 'Не важно') {
          const from = parseInt(filters.ageFrom.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.age_from >= from)
        }
        if (filters.ageTo && filters.ageTo !== 'Не важно') {
          const to = parseInt(filters.ageTo.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.age_from <= to)
        }
      }

      // Capacity filters
      if (mode === 'roommate') {
        if (filters.peopleCount && filters.peopleCount !== 'Не важно') {
          const val = parseInt(filters.peopleCount.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.total_people === val)
        }
        if (filters.searchingCount && filters.searchingCount !== 'Не важно') {
          const val = parseInt(filters.searchingCount.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.people_count === val)
        }
      } else {
        if (filters.peopleCount && filters.peopleCount !== 'Не важно') {
          const val = parseInt(filters.peopleCount.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.total_people === val)
        }
        if (filters.searchingCount && filters.searchingCount !== 'Не важно') {
          const val = parseInt(filters.searchingCount.replace(/\D/g, '')) || 0
          result = result.filter((item) => item.searching_count === val)
        }
      }

      // Only Photos Toggle
      if (filters.onlyPhotos) {
        result = result.filter((item) => item.photos && item.photos.length > 0)
      }

      // Hide Viewed Toggle
      if (filters.hideViewed) {
        result = result.filter((item) => !viewed.includes(item.id))
      }

      // Apply Sorting
      result.sort((a, b) => {
        // Always place premium at the very top
        if (a.is_premium && !b.is_premium) return -1
        if (!a.is_premium && b.is_premium) return 1

        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sortBy === 'price_asc') {
          return a.price_from - b.price_from
        }
        if (sortBy === 'price_desc') {
          return b.price_from - a.price_from
        }
        return 0
      })

      if (mode === 'apartment') {
        setApartmentListings(result)
        setHasFetchedApartments(true)
      } else {
        setRoommateListings(result)
        setHasFetchedRoommates(true)
      }
    } catch (err) {
      if (fetchId === fetchCounter.current) {
        console.error('Error loading listings:', err)
      }
    } finally {
      if (fetchId === fetchCounter.current) {
        setIsLoading(false)
      }
    }
  }, [
    mode,
    filters,
    hasDistricts,
    viewed,
    sortBy,
    setApartmentListings,
    setRoommateListings,
    setHasFetchedApartments,
    setHasFetchedRoommates
  ])

  // Refetch when search mode changes or filters change
  useEffect(() => {
    const t = setTimeout(() => {
      fetchListings()
    }, 0)
    return () => clearTimeout(t)
  }, [fetchListings])

  const handleApplySort = () => {
    setShowSort(false)
    fetchListings()
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="sticky top-0 z-50 bg-brand-bg-light dark:bg-brand-bg-dark w-full">
        {/* Dynamic Header — mode toggle only, no icons (Figma spec) */}
        <Header type="mode-toggle" showThemeToggle={false} showHelpToggle={false} />

        {/* Toolbar Sub-bar — matches Figma: black pill left, icons right */}
        <div className="w-full flex justify-center px-4 pt-[2px] pb-[6px] border-b border-zinc-200/20 dark:border-zinc-800/20 transition-colors duration-200">
          <div className="flex justify-between w-[339px] mx-auto gap-[5px] font-unbounded text-[16px]">
            {/* Left Filter Pill */}
            <button
              onClick={() => router.push('/filter')}
              className="w-[210px] h-[36px] bg-[#000000] text-white rounded-[57px] flex items-center pl-[11px] gap-[31px] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <SlidersHorizontal className="w-[24px] h-[24px] text-white stroke-[2.25px] flex-shrink-0" />
              <span className="font-normal leading-none">фильтр</span>
            </button>

            {/* Right Actions Pill */}
            <div className="w-[124px] h-[36px] bg-[#000000] text-white rounded-[57px] flex items-center justify-between px-[12px] shadow-md">
              {/* Sort button */}
              <button
                onClick={() => setShowSort(true)}
                className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150"
                aria-label="Сортировка"
              >
                <SortIcon className="text-white shrink-0" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150"
                aria-label="Смена темы"
              >
                {theme === 'light' ? (
                  <SunIcon className="text-white shrink-0" />
                ) : (
                  <MoonIcon className="text-white shrink-0" />
                )}
              </button>

              {/* Help / Instruction button */}
              <button
                onClick={() => router.push('/instruction')}
                className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150"
                aria-label="Инструкция"
              >
                <HelpIcon className="text-white shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main listings list */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {isLoading && listings.length === 0 ? (
          <div className="w-full py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
            <span className="text-xs text-brand-gray">Загрузка объявлений...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4">
            <span className="text-sm font-semibold text-brand-black dark:text-brand-white mb-1">Ничего не найдено</span>
            <span className="text-xs text-brand-gray max-w-[240px]">Попробуйте изменить параметры фильтрации или обновить ленту</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>

      {/* --- SORTING MODAL --- */}
      {showSort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay background blur */}
          <div
            onClick={() => setShowSort(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
          ></div>

          {/* Modal content */}
          <div className="relative w-full max-w-[280px] bg-[#FFFFFF] dark:bg-[#313131] border border-gray-250 dark:border-zinc-800 rounded-[28px] p-5 shadow-2xl transition-all duration-200 select-none">
            <h3 className="text-sm font-black mb-4 text-center text-[#000000] dark:text-white uppercase tracking-wider">
              Сортировка
            </h3>

            <div className="flex flex-col gap-2.5 mb-5">
              {([
                { label: 'Сначала новые', value: 'newest' },
                { label: 'Сначала старые', value: 'oldest' },
                { label: 'Низкая цена', value: 'price_asc' },
                { label: 'Высокая цена', value: 'price_desc' },
              ] as const).map((opt) => {
                const isSelected = sortBy === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`w-full py-3 px-4 rounded-full flex items-center text-xs transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#F7F7F7] dark:bg-[#202020] text-[#000000] dark:text-white font-black'
                        : 'bg-[#F7F7F7] dark:bg-[#202020] text-[#9D9D9D] font-bold'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full border mr-3 flex items-center justify-center ${
                        isSelected ? 'border-[#007BFF] bg-[#007BFF]' : 'border-gray-300 dark:border-zinc-700'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-[#FFFFFF] rounded-full"></div>}
                    </div>
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleApplySort}
              className="w-full bg-[#007BFF] text-[#FFFFFF] rounded-full py-3.5 text-xs font-black uppercase tracking-widest active:scale-95 transition-all duration-200"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
