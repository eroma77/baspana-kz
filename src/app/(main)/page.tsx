'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, ArrowUpDown, Sun, Moon, HelpCircle, X, Camera, Eye, SlidersHorizontal } from 'lucide-react'

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
    setRoommateListings 
  } = useAppStore()
  
  const listings = mode === 'apartment' ? apartmentListings : roommateListings
  
  // Data States
  const hasPreloadedData = listings.length > 0
  const [isLoading, setIsLoading] = useState(!hasPreloadedData)

  // Modal Toggles
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  // Filter States
  const [filterCity, setFilterCity] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('Не важно') // Default for apartment
  const [filterGender, setFilterGender] = useState('любой')
  const [filterAgeFrom, setFilterAgeFrom] = useState('')
  const [filterAgeTo, setFilterAgeTo] = useState('')
  const [filterRooms, setFilterRooms] = useState('любая')
  const [filterPeopleCount, setFilterPeopleCount] = useState('')
  const [filterSearchingCount, setFilterSearchingCount] = useState('')
  const [filterCanLiveWith, setFilterCanLiveWith] = useState('Не важно')
  const [filterDeposit, setFilterDeposit] = useState('не важно')
  const [filterContract, setFilterContract] = useState('не важно')
  const [filterPriceFrom, setFilterPriceFrom] = useState('')
  const [filterPriceTo, setFilterPriceTo] = useState('')
  const [filterOnlyPhotos, setFilterOnlyPhotos] = useState(false)
  const [filterHideViewed, setFilterHideViewed] = useState(false)

  // Request counter ref to prevent race conditions
  const fetchCounter = useRef(0)

  // Sort State
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest')

  // Dropdown UI states (stores key of active open dropdown)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Active City districts matrix
  const currentCityData = CITIES_DATA.find((c) => c.city === filterCity)
  const hasDistricts = currentCityData && currentCityData.districts.length > 0

  // If city changes, reset district
  useEffect(() => {
    const t = setTimeout(() => {
      if (hasDistricts) {
        setFilterDistrict(mode === 'apartment' ? 'Не важно' : (currentCityData?.districts[0] || ''))
      } else {
        setFilterDistrict('-')
      }
    }, 0)
    return () => clearTimeout(t)
  }, [filterCity, hasDistricts, mode, currentCityData])

  // Prefetch instruction page for instant load
  useEffect(() => {
    router.prefetch('/instruction')
  }, [router])

  // Sync district filter when mode changes
  useEffect(() => {
    if (hasDistricts) {
      if (mode === 'roommate' && filterDistrict === 'Не важно') {
        setFilterDistrict(currentCityData?.districts[0] || '')
      } else if (mode === 'apartment' && filterDistrict !== 'Не важно' && !currentCityData?.districts.includes(filterDistrict)) {
        setFilterDistrict('Не важно')
      }
    }
  }, [mode, hasDistricts, currentCityData, filterDistrict])

  const fetchListings = useCallback(async () => {
    const fetchId = ++fetchCounter.current
    const storeState = useAppStore.getState()
    const currentListings = mode === 'apartment' ? storeState.apartmentListings : storeState.roommateListings
    const hasPreloaded = currentListings.length > 0
    if (!hasPreloaded) {
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
        .eq('mode', mode)
        .eq('status', 'active')

      // Apply DB filters
      if (filterCity) {
        query = query.eq('city', filterCity)
      }
      if (hasDistricts && filterDistrict !== 'Не важно' && filterDistrict !== '-') {
        query = query.eq('district', filterDistrict)
      }
      if (filterGender && filterGender !== 'любой') {
        // Can be male, female or any
        query = query.eq('gender', filterGender)
      }
      if (filterRooms && filterRooms !== 'любая') {
        query = query.eq('rooms', filterRooms)
      }
      if (filterDeposit === 'да') {
        query = query.gt('deposit', 0)
      } else if (filterDeposit === 'нет') {
        query = query.eq('deposit', 0)
      }
      if (filterContract === 'да') {
        query = query.eq('contract', 'yes')
      } else if (filterContract === 'нет') {
        query = query.eq('contract', 'no')
      }
      if (mode === 'apartment' && filterCanLiveWith && filterCanLiveWith !== 'Не важно') {
        query = query.eq('can_live_with', filterCanLiveWith)
      }

      // Budget Ranges
      if (filterPriceFrom) {
        query = query.gte('price_from', parseInt(filterPriceFrom.replace(/\s/g, '')))
      }
      if (filterPriceTo) {
        query = query.lte('price_from', parseInt(filterPriceTo.replace(/\s/g, '')))
      }

      const { data, error } = await query
      if (error) throw error
      if (fetchId !== fetchCounter.current) return

      let result = (data as Listing[]) || []

      // Client-side post filtering
      // Age Range match
      if (filterAgeFrom) {
        const from = parseInt(filterAgeFrom)
        result = result.filter((item) => item.age_from >= from || item.age_to >= from)
      }
      if (filterAgeTo) {
        const to = parseInt(filterAgeTo)
        result = result.filter((item) => item.age_from <= to || item.age_to <= to)
      }

      // Capacity filters
      if (filterPeopleCount) {
        result = result.filter((item) => item.people_count === parseInt(filterPeopleCount))
      }
      if (filterSearchingCount) {
        result = result.filter((item) => item.searching_count === parseInt(filterSearchingCount))
      }

      // Only Photos Toggle
      if (filterOnlyPhotos) {
        result = result.filter((item) => item.photos && item.photos.length > 0)
      }

      // Hide Viewed Toggle
      if (filterHideViewed) {
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
      } else {
        setRoommateListings(result)
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
    filterCity,
    hasDistricts,
    filterDistrict,
    filterGender,
    filterRooms,
    filterDeposit,
    filterContract,
    filterCanLiveWith,
    filterPriceFrom,
    filterPriceTo,
    filterAgeFrom,
    filterAgeTo,
    filterPeopleCount,
    filterSearchingCount,
    filterOnlyPhotos,
    filterHideViewed,
    viewed,
    sortBy,
    setApartmentListings,
    setRoommateListings,
  ])

  // Refetch when search mode changes
  useEffect(() => {
    const t = setTimeout(() => {
      fetchListings()
    }, 0)
    return () => clearTimeout(t)
  }, [fetchListings])

  // Filter application handler
  const handleApplyFilters = () => {
    setShowFilters(false)
    if (mode === 'roommate' && filterDistrict === 'Не важно' && currentCityData && currentCityData.districts.length > 0) {
      setFilterDistrict(currentCityData.districts[0])
    }
    fetchListings()
  }

  // Filter reset handler
  const handleResetFilters = () => {
    setFilterCity('')
    setFilterDistrict(mode === 'apartment' ? 'Не важно' : '-')
    setFilterGender('любой')
    setFilterAgeFrom('')
    setFilterAgeTo('')
    setFilterRooms('любая')
    setFilterPeopleCount('')
    setFilterSearchingCount('')
    setFilterCanLiveWith('Не важно')
    setFilterDeposit('не важно')
    setFilterContract('не важно')
    setFilterPriceFrom('')
    setFilterPriceTo('')
    setFilterOnlyPhotos(false)
    setFilterHideViewed(false)
    setActiveDropdown(null)
  }

  const handleApplySort = () => {
    setShowSort(false)
    fetchListings()
  }

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="sticky top-0 z-50 bg-brand-bg-light dark:bg-brand-bg-dark w-full">
        {/* Dynamic Header — mode toggle only, no icons (Figma spec) */}
        <Header type="mode-toggle" showThemeToggle={false} showHelpToggle={false} />

        {/* Toolbar Sub-bar — matches Figma: black pill left, icons right */}
        <div className="w-full flex justify-center px-4 pt-[8px] pb-[6px] border-b border-zinc-200/20 dark:border-zinc-800/20 transition-colors duration-200">
          <div className="flex justify-between w-[339px] mx-auto gap-[5px] font-unbounded text-[16px]">
            {/* Left Filter Pill */}
            <button
              onClick={() => setShowFilters(true)}
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
                <svg className="w-[23px] h-[23px] text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 3l-5 6h10l-5-6zm0 18l5-6H7l5 6z" />
                </svg>
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150"
                aria-label="Смена темы"
              >
                {theme === 'light' ? (
                  <Sun className="w-[18px] h-[18px] text-white fill-white" />
                ) : (
                  <div className="scale-[0.85] flex items-center justify-center">
                    <Moon className="w-[17px] h-[17px] text-white fill-white" />
                  </div>
                )}
              </button>

              {/* Help / Instruction button */}
              <button
                onClick={() => router.push('/instruction')}
                className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-150"
                aria-label="Инструкция"
              >
                <div className="w-[23px] h-[23px] rounded-full bg-white text-black flex items-center justify-center font-unbounded font-bold text-[13px] select-none leading-none">
                  ?
                </div>
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

      {/* --- FILTERS DRAWER / MODAL --- */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay */}
          <div
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          ></div>

          {/* Drawer Content */}
          <div className="relative w-full max-w-md mx-auto h-[85vh] bg-[#FFFFFF] dark:bg-[#313131] border-t border-gray-200 dark:border-zinc-800 rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden select-none animate-slide-up">
            {/* Header Capsule - Matches Figma header style exactly */}
            <div className="w-full flex items-center justify-between px-4 py-3 sticky top-0 z-40 bg-[#FFFFFF] dark:bg-[#313131] border-b border-gray-200/50 dark:border-zinc-800 transition-all duration-200 ease-in-out shrink-0">
              {/* Left filter capsule */}
              <div className="bg-[#000000] text-white rounded-full flex items-center pl-[6px] pr-4 h-[36px] shadow-md transition-all duration-200 ease-in-out">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-white hover:text-zinc-300 transition-colors duration-200 ease-in-out flex items-center justify-center animate-none"
                    aria-label="Назад"
                  >
                    <div className="w-[24px] h-[24px] rounded-full border border-white/20 flex items-center justify-center">
                      <ChevronLeft className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                  <span className="font-normal text-xs tracking-wide lowercase font-unbounded">
                    фильтр
                  </span>
                </div>
              </div>

              {/* Right theme and help capsule */}
              <div className="w-[100px] h-[36px] bg-[#000000] text-white rounded-full flex items-center justify-between px-[12px] shadow-md transition-all duration-200 ease-in-out">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-200 ease-in-out"
                  aria-label="Смена темы"
                >
                  {theme === 'light' ? (
                    <Sun className="w-[18px] h-[18px] text-white fill-white" />
                  ) : (
                    <Moon className="w-[17px] h-[17px] text-white fill-white" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false)
                    router.push('/instruction')
                  }}
                  className="w-[23px] h-[23px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-200 ease-in-out"
                  aria-label="Инструкция"
                >
                  <div className="w-[20px] h-[20px] rounded-full border border-white/50 flex items-center justify-center text-white font-bold text-[11px] font-unbounded select-none leading-none">
                    ?
                  </div>
                </button>
              </div>
            </div>

            {/* Fields grid scroll container */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 text-xs font-semibold">
              
              {/* Row 1: Город & Пол */}
              <div className="grid grid-cols-2 gap-3">
                {/* City Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('city')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterCity
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">{filterCity || 'Город'}</span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'city' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto transition-all duration-200 ease-in-out">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCity('')
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white border-b border-zinc-200/10 dark:border-zinc-800/10 transition-colors duration-200 ease-in-out"
                      >
                        Все города
                      </button>
                      {CITIES_DATA.map((c) => (
                        <button
                          key={c.city}
                          type="button"
                          onClick={() => {
                            setFilterCity(c.city)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {c.city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gender Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('gender')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterGender !== 'любой'
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">{filterGender === 'любой' ? 'Пол' : filterGender}</span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'gender' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['любой', 'мужской', 'женский'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setFilterGender(g)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Район (Disabled if empty) */}
              <div className="relative">
                <button
                  type="button"
                  disabled={!hasDistricts}
                  onClick={() => toggleDropdown('district')}
                  className={`w-full border rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                    hasDistricts
                      ? filterDistrict && filterDistrict !== 'Не важно' && filterDistrict !== '-'
                        ? 'bg-[#FFFFFF] dark:bg-[#202020] border-gray-200 dark:border-zinc-800 text-[#000000] dark:text-white font-semibold'
                        : 'bg-[#FFFFFF] dark:bg-[#202020] border-gray-200 dark:border-zinc-800 text-[#9D9D9D] font-normal'
                      : 'bg-[#F7F7F7] dark:bg-[#202020] border-zinc-200 dark:border-zinc-800 text-[#9D9D9D] opacity-50 cursor-not-allowed font-normal'
                  }`}
                >
                  <span className="truncate">
                    {!hasDistricts
                      ? '-'
                      : filterDistrict === 'Не важно'
                      ? 'Район'
                      : filterDistrict}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'district' && hasDistricts && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto transition-all duration-200 ease-in-out">
                    {mode === 'apartment' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDistrict('Не важно')
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                      >
                        Не важно
                      </button>
                    )}
                    {currentCityData?.districts.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setFilterDistrict(d)
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Возраст (от / до) & Комната */}
              <div className="grid grid-cols-2 gap-3">
                {/* Age Range Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('age')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterAgeFrom || filterAgeTo
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {(filterAgeFrom || filterAgeTo)
                        ? (filterAgeFrom && filterAgeTo
                          ? `${filterAgeFrom} - ${filterAgeTo}`
                          : filterAgeFrom
                          ? `от ${filterAgeFrom}`
                          : `до ${filterAgeTo}`)
                        : 'Возраст'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'age' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 flex flex-col gap-2 transition-all duration-200 ease-in-out">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="от"
                          value={filterAgeFrom}
                          onChange={(e) => setFilterAgeFrom(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-center text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none transition-colors duration-200 ease-in-out"
                        />
                        <input
                          type="text"
                          placeholder="до"
                          value={filterAgeTo}
                          onChange={(e) => setFilterAgeTo(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-center text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none transition-colors duration-200 ease-in-out"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(null)}
                        className="w-full bg-[#007BFF] text-white py-1.5 rounded-xl font-bold text-[10px] uppercase hover:bg-blue-600 active:scale-95 transition-all duration-150 ease-in-out"
                      >
                        Готово
                      </button>
                    </div>
                  )}
                </div>

                {/* Rooms Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('rooms')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterRooms !== 'любая'
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {filterRooms === 'любая' ? 'Комната' : `${filterRooms} комн.`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'rooms' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['любая', '1', '2', '3', '4+'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFilterRooms(r)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {r === 'любая' ? 'любая комната' : `${r} комната`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Общий & Нас Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total People Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('peopleCount')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterPeopleCount
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {filterPeopleCount ? `Общий: ${filterPeopleCount}` : 'Общий:'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'peopleCount' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['любое', '1', '2', '3', '4', '5+'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setFilterPeopleCount(p === 'любое' ? '' : p)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {p === 'любое' ? 'любое число' : p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Searching Count Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('searchingCount')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterSearchingCount
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {filterSearchingCount ? `Нас: ${filterSearchingCount}` : 'Нас:'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'searchingCount' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['любое', '1', '2', '3', '4+'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setFilterSearchingCount(s === 'любое' ? '' : s)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {s === 'любое' ? 'любое число' : s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: С кем могу жить (Only in Apartment mode) */}
              {mode === 'apartment' && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('canLiveWith')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterCanLiveWith !== 'Не важно'
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {filterCanLiveWith === 'Не важно' ? 'Могу жить с' : filterCanLiveWith}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'canLiveWith' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['Не важно', 'Только парни', 'Только девочки'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setFilterCanLiveWith(item)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Row 6: Депозит & Договор */}
              <div className="grid grid-cols-2 gap-3">
                {/* Deposit Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('deposit')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterDeposit !== 'не важно'
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {filterDeposit === 'не важно' ? 'Депозит' : `Депозит: ${filterDeposit}`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'deposit' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['не важно', 'да', 'нет'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setFilterDeposit(d)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contract Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('contract')}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] transition-all duration-200 ease-in-out ${
                      filterContract !== 'не важно'
                        ? 'text-[#000000] dark:text-white font-semibold'
                        : 'text-[#9D9D9D] font-normal'
                    }`}
                  >
                    <span className="truncate">
                      {filterContract === 'не важно' ? 'Договор' : `Договор: ${filterContract}`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                  </button>
                  {activeDropdown === 'contract' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                      {['не важно', 'да', 'нет'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setFilterContract(c)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white transition-colors duration-200 ease-in-out"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 7: Бюджет от / до */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="От"
                  value={formatBudgetDisplay(filterPriceFrom)}
                  onChange={(e) => setFilterPriceFrom(e.target.value.replace(/\D/g, ''))}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left placeholder:text-[#9D9D9D] focus:outline-none min-h-[44px] transition-all duration-200 ease-in-out ${
                    filterPriceFrom
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                />
                <input
                  type="text"
                  placeholder="До"
                  value={formatBudgetDisplay(filterPriceTo)}
                  onChange={(e) => setFilterPriceTo(e.target.value.replace(/\D/g, ''))}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left placeholder:text-[#9D9D9D] focus:outline-none min-h-[44px] transition-all duration-200 ease-in-out ${
                    filterPriceTo
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                />
              </div>

              {/* Row 8: Toggles (Only Photos / Hide Viewed) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Only Photos Toggle */}
                <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
                  <Camera className={`w-5 h-5 transition-colors duration-200 ease-in-out ${filterOnlyPhotos ? 'text-[#007BFF]' : 'text-[#9D9D9D]'}`} />
                  <button
                    type="button"
                    onClick={() => setFilterOnlyPhotos(!filterOnlyPhotos)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center ${
                      filterOnlyPhotos ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        filterOnlyPhotos ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Hide Viewed Toggle */}
                <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
                  <Eye className={`w-5 h-5 transition-colors duration-200 ease-in-out ${filterHideViewed ? 'text-[#007BFF]' : 'text-[#9D9D9D]'}`} />
                  <button
                    type="button"
                    onClick={() => setFilterHideViewed(!filterHideViewed)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center ${
                      filterHideViewed ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        filterHideViewed ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="w-full p-5 border-t border-gray-150 dark:border-zinc-850 flex justify-between gap-3 shrink-0 transition-all duration-200 ease-in-out">
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-[#007BFF]/10 text-[#007BFF] rounded-xl py-3.5 px-4 font-bold text-center hover:bg-[#007BFF]/20 active:scale-[0.98] transition-all duration-200 ease-in-out"
              >
                Сбросить
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-[#007BFF] text-[#FFFFFF] rounded-xl py-3.5 px-4 font-bold text-center hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 ease-in-out"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
