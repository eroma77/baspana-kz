'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ArrowUpDown, Sun, Moon, HelpCircle, X, Camera, Eye, SlidersHorizontal } from 'lucide-react'

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
              <div className="bg-[#000000] text-white rounded-full flex items-center px-3 py-1.5 min-h-[44px] shadow-md flex-1 max-w-[280px]">
                <div className="flex items-center w-full">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="mr-2 text-white hover:text-[#007BFF] transition-colors duration-200"
                    aria-label="Назад"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="font-black text-sm tracking-wide lowercase truncate">
                    фильтр
                  </span>
                </div>
              </div>

              {/* Theme & Help icons */}
              <div className="flex items-center gap-3 pl-3">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label="Смена темы"
                >
                  {theme === 'light' ? (
                    <Sun className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-[#007BFF] fill-[#007BFF]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false)
                    router.push('/instruction')
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label="Инструкция"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fields grid scroll container */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 text-xs font-semibold">
              
              {/* Row 1: Город & Пол */}
              <div className="grid grid-cols-2 gap-3">
                {/* City Dropdown */}
                <div className="relative">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Город</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('city')}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-[#000000] dark:text-white font-bold flex justify-between items-center"
                  >
                    <span>{filterCity || 'Все города'}</span>
                    <span className="text-[10px] text-[#9D9D9D]">▼</span>
                  </button>
                  {activeDropdown === 'city' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCity('')
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white border-b border-zinc-200/10 dark:border-zinc-800/10"
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
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
                        >
                          {c.city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gender Dropdown */}
                <div className="relative">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Ограничения по полу</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('gender')}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-[#000000] dark:text-white font-bold flex justify-between items-center"
                  >
                    <span>{filterGender}</span>
                    <span className="text-[10px] text-[#9D9D9D]">▼</span>
                  </button>
                  {activeDropdown === 'gender' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['любой', 'мужской', 'женский'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setFilterGender(g)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
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
                <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Район</label>
                <button
                  type="button"
                  disabled={!hasDistricts}
                  onClick={() => toggleDropdown('district')}
                  className={`w-full border rounded-2xl py-3 px-4 text-left font-bold flex justify-between items-center transition-all ${
                    hasDistricts
                      ? 'bg-[#FFFFFF] dark:bg-[#202020] border-gray-200 dark:border-zinc-800 text-[#000000] dark:text-white'
                      : 'bg-zinc-200 dark:bg-[#202020] border-zinc-200 dark:border-zinc-800 text-[#9D9D9D] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {mode === 'roommate' && filterDistrict === 'Не важно' && currentCityData && currentCityData.districts.length > 0
                      ? currentCityData.districts[0]
                      : filterDistrict}
                  </span>
                  <span className="text-[10px] text-[#9D9D9D]">▼</span>
                </button>
                {activeDropdown === 'district' && hasDistricts && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {mode === 'apartment' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDistrict('Не важно')
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
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
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Возраст (от / до) & Комната */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Возраст сожителя</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="от"
                      value={filterAgeFrom}
                      onChange={(e) => setFilterAgeFrom(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-3.5 text-center text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="до"
                      value={filterAgeTo}
                      onChange={(e) => setFilterAgeTo(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-3.5 text-center text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Комнатность</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('rooms')}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-[#000000] dark:text-white font-bold flex justify-between items-center"
                  >
                    <span>{filterRooms}</span>
                    <span className="text-[10px] text-[#9D9D9D]">▼</span>
                  </button>
                  {activeDropdown === 'rooms' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['любая', '1', '2', '3', '4+'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFilterRooms(r)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
                        >
                          {r} {r !== 'любая' ? 'комната' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Люди (Общее количество / Количество ищущих) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Общее число людей</label>
                  <input
                    type="text"
                    placeholder="человек всего"
                    value={filterPeopleCount}
                    onChange={(e) => setFilterPeopleCount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Сколько сожителей ищут</label>
                  <input
                    type="text"
                    placeholder="ищут руммейтов"
                    value={filterSearchingCount}
                    onChange={(e) => setFilterSearchingCount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: С кем могу жить (Only in Apartment mode) */}
              {mode === 'apartment' && (
                <div className="relative">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">С кем могу жить</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('canLiveWith')}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-[#000000] dark:text-white font-bold flex justify-between items-center"
                  >
                    <span>{filterCanLiveWith}</span>
                    <span className="text-[10px] text-[#9D9D9D]">▼</span>
                  </button>
                  {activeDropdown === 'canLiveWith' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['Не важно', 'Только парни', 'Только девочки'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setFilterCanLiveWith(item)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
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
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Депозит</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('deposit')}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-[#000000] dark:text-white font-bold flex justify-between items-center"
                  >
                    <span>{filterDeposit}</span>
                    <span className="text-[10px] text-[#9D9D9D]">▼</span>
                  </button>
                  {activeDropdown === 'deposit' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['не важно', 'да', 'нет'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setFilterDeposit(d)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contract Dropdown */}
                <div className="relative">
                  <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Официальный договор</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('contract')}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-[#000000] dark:text-white font-bold flex justify-between items-center"
                  >
                    <span>{filterContract}</span>
                    <span className="text-[10px] text-[#9D9D9D]">▼</span>
                  </button>
                  {activeDropdown === 'contract' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['не важно', 'да', 'нет'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setFilterContract(c)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-brand-black dark:text-brand-white"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 7: Бюджет от / до */}
              <div className="flex flex-col">
                <label className="block text-[#9D9D9D] text-[10px] uppercase mb-1">Бюджет (тенге)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="от"
                    value={formatBudgetDisplay(filterPriceFrom)}
                    onChange={(e) => setFilterPriceFrom(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="до"
                    value={formatBudgetDisplay(filterPriceTo)}
                    onChange={(e) => setFilterPriceTo(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#FFFFFF] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-[#000000] dark:text-white font-bold placeholder:text-[#9D9D9D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Functional Toggles Row */}
              <div className="flex items-center justify-between gap-4 mt-2 py-3 border-y border-gray-150 dark:border-zinc-850">
                {/* Only Photos Switch */}
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-[#007BFF]" />
                  <span className="text-xs text-brand-black dark:text-brand-white font-bold">Только с фото</span>
                  <button
                    type="button"
                    onClick={() => setFilterOnlyPhotos(!filterOnlyPhotos)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                      filterOnlyPhotos ? 'bg-[#007BFF]' : 'bg-gray-300 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`bg-[#FFFFFF] w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                        filterOnlyPhotos ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Hide Viewed Switch */}
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-[#007BFF]" />
                  <span className="text-xs text-brand-black dark:text-brand-white font-bold">Скрыть просмотренные</span>
                  <button
                    type="button"
                    onClick={() => setFilterHideViewed(!filterHideViewed)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                      filterHideViewed ? 'bg-[#007BFF]' : 'bg-gray-300 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`bg-[#FFFFFF] w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                        filterHideViewed ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="w-full p-5 border-t border-gray-150 dark:border-zinc-850 flex justify-between gap-3 shrink-0">
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-[#007BFF]/10 dark:bg-[#202020] text-[#007BFF] dark:text-[#FFFFFF] rounded-2xl py-3.5 px-4 font-black text-center hover:bg-blue-100 dark:hover:bg-zinc-750 active:scale-98 transition-all duration-200 uppercase tracking-wider"
              >
                Сбросить
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-[#007BFF] text-[#FFFFFF] rounded-2xl py-3.5 px-4 font-black text-center hover:bg-blue-600 active:scale-98 transition-all duration-200 uppercase tracking-wider"
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
