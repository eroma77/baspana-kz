'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, ArrowUpDown, Sun, Moon, HelpCircle, X, Camera, Eye } from 'lucide-react'

// Formatting helper for budgets (spaces as thousands separators)
function formatBudgetDisplay(val: string) {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function FeedPage() {
  const router = useRouter()
  const { mode, viewed, theme, setTheme } = useAppStore()
  
  // Data States
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal Toggles
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  // Filter States
  const [filterCity, setFilterCity] = useState('Алматы')
  const [filterDistrict, setFilterDistrict] = useState('Не важно') // Default for apartment
  const [filterGender, setFilterGender] = useState('любой')
  const [filterAgeFrom, setFilterAgeFrom] = useState('')
  const [filterAgeTo, setFilterAgeTo] = useState('')
  const [filterRooms, setFilterRooms] = useState('любая')
  const [filterPeopleCount, setFilterPeopleCount] = useState('')
  const [filterSearchingCount, setFilterSearchingCount] = useState('')
  const [filterCanLiveWith, setFilterCanLiveWith] = useState('все')
  const [filterDeposit, setFilterDeposit] = useState('не важно')
  const [filterContract, setFilterContract] = useState('не важно')
  const [filterPriceFrom, setFilterPriceFrom] = useState('')
  const [filterPriceTo, setFilterPriceTo] = useState('')
  const [filterOnlyPhotos, setFilterOnlyPhotos] = useState(false)
  const [filterHideViewed, setFilterHideViewed] = useState(true)

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
        setFilterDistrict(mode === 'apartment' ? 'Не важно' : currentCityData.districts[0])
      } else {
        setFilterDistrict('-')
      }
    }, 0)
    return () => clearTimeout(t)
  }, [filterCity, mode, hasDistricts, currentCityData])

  const fetchListings = useCallback(async () => {
    setIsLoading(true)
    try {
      // Call remote self-cleaning function
      await supabase.rpc('cleanup_listings')

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
      if (mode === 'apartment' && filterCanLiveWith && filterCanLiveWith !== 'все') {
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

      setListings(result)
    } catch (err) {
      console.error('Error loading listings:', err)
    } finally {
      setIsLoading(false)
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
    fetchListings()
  }

  // Filter reset handler
  const handleResetFilters = () => {
    setFilterCity('Алматы')
    setFilterDistrict(mode === 'apartment' ? 'Не важно' : 'Алатауский')
    setFilterGender('любой')
    setFilterAgeFrom('')
    setFilterAgeTo('')
    setFilterRooms('любая')
    setFilterPeopleCount('')
    setFilterSearchingCount('')
    setFilterCanLiveWith('все')
    setFilterDeposit('не важно')
    setFilterContract('не важно')
    setFilterPriceFrom('')
    setFilterPriceTo('')
    setFilterOnlyPhotos(false)
    setFilterHideViewed(mode === 'roommate') // Defaults for roommate
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
      {/* Dynamic Header — mode toggle only, no icons (Figma spec) */}
      <Header type="mode-toggle" showThemeToggle={false} showHelpToggle={false} />

      {/* Toolbar Sub-bar — matches Figma: black pill left, icons right */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-brand-bg-light dark:bg-brand-bg-dark border-b border-gray-200/50 dark:border-zinc-800 transition-colors duration-200">
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2.5 bg-black text-white rounded-full px-4 py-2.5 text-xs font-bold active:scale-95 transition-all duration-200 shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          фильтр
        </button>

        <div className="flex items-center gap-2">
          {/* Sort button */}
          <button
            onClick={() => setShowSort(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Сортировка"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Смена темы"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {/* Help / Instruction button */}
          <button
            onClick={() => router.push('/instruction')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Инструкция"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main listings list */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {isLoading ? (
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
          <div className="relative w-full max-w-[280px] bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl transition-all duration-200 select-none">
            <h3 className="text-sm font-extrabold mb-4 text-center text-brand-black dark:text-brand-white uppercase tracking-wider">
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
                    className={`w-full py-2.5 px-4 rounded-full flex items-center text-xs font-bold transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/30'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-brand-gray border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                        isSelected ? 'border-brand-blue bg-brand-blue' : 'border-gray-300 dark:border-zinc-700'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleApplySort}
              className="w-full bg-brand-blue text-white rounded-full py-3 text-xs font-bold text-center active:scale-95 transition-all duration-200"
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
          <div className="relative w-full max-w-md mx-auto h-[85vh] bg-white dark:bg-brand-card-dark border-t border-gray-200 dark:border-zinc-800 rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden select-none animate-slide-up">
            {/* Header capsule */}
            <div className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-150 dark:border-zinc-850 shrink-0">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-brand-black dark:text-brand-white">
                Фильтр
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-brand-black dark:text-brand-white flex items-center justify-center hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields grid scroll container */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 text-xs font-semibold">
              
              {/* Row 1: Город & Пол */}
              <div className="grid grid-cols-2 gap-3">
                {/* City Dropdown */}
                <div className="relative">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Город</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('city')}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                  >
                    <span>{filterCity}</span>
                    <span className="text-[10px] text-brand-gray">▼</span>
                  </button>
                  {activeDropdown === 'city' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                      {CITIES_DATA.map((c) => (
                        <button
                          key={c.city}
                          type="button"
                          onClick={() => {
                            setFilterCity(c.city)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                        >
                          {c.city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gender Dropdown */}
                <div className="relative">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Ограничения по полу</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('gender')}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                  >
                    <span>{filterGender}</span>
                    <span className="text-[10px] text-brand-gray">▼</span>
                  </button>
                  {activeDropdown === 'gender' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['любой', 'мужской', 'женский'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setFilterGender(g)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Район</label>
                <button
                  type="button"
                  disabled={!hasDistricts}
                  onClick={() => toggleDropdown('district')}
                  className={`w-full border rounded-2xl py-3 px-4 text-left font-bold flex justify-between items-center transition-all ${
                    hasDistricts
                      ? 'bg-zinc-50 dark:bg-zinc-850 border-gray-200 dark:border-zinc-800 text-brand-black dark:text-brand-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-brand-gray opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span>{filterDistrict}</span>
                  <span className="text-[10px] text-brand-gray">▼</span>
                </button>
                {activeDropdown === 'district' && hasDistricts && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {mode === 'apartment' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterDistrict('Не важно')
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                        className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Возраст сожителя</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      placeholder="от"
                      value={filterAgeFrom}
                      onChange={(e) => setFilterAgeFrom(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-3.5 text-center text-brand-black dark:text-brand-white font-bold placeholder:text-brand-gray focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="до"
                      value={filterAgeTo}
                      onChange={(e) => setFilterAgeTo(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-3.5 text-center text-brand-black dark:text-brand-white font-bold placeholder:text-brand-gray focus:outline-none"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Комнатность</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('rooms')}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                  >
                    <span>{filterRooms}</span>
                    <span className="text-[10px] text-brand-gray">▼</span>
                  </button>
                  {activeDropdown === 'rooms' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['любая', '1', '2', '3', '4+'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFilterRooms(r)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Общее число людей</label>
                  <input
                    type="number"
                    placeholder="человек всего"
                    value={filterPeopleCount}
                    onChange={(e) => setFilterPeopleCount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold placeholder:text-brand-gray focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Сколько сожителей ищут</label>
                  <input
                    type="number"
                    placeholder="ищут руммейтов"
                    value={filterSearchingCount}
                    onChange={(e) => setFilterSearchingCount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold placeholder:text-brand-gray focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: С кем могу жить (Only in Apartment mode) */}
              {mode === 'apartment' && (
                <div className="relative">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">С кем могу жить</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('canLiveWith')}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                  >
                    <span>{filterCanLiveWith}</span>
                    <span className="text-[10px] text-brand-gray">▼</span>
                  </button>
                  {activeDropdown === 'canLiveWith' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['все', 'парни', 'девушки', 'семейная пара'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setFilterCanLiveWith(item)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Депозит</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('deposit')}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                  >
                    <span>{filterDeposit}</span>
                    <span className="text-[10px] text-brand-gray">▼</span>
                  </button>
                  {activeDropdown === 'deposit' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['не важно', 'да', 'нет'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setFilterDeposit(d)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contract Dropdown */}
                <div className="relative">
                  <label className="block text-brand-gray text-[10px] uppercase mb-1">Официальный договор</label>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('contract')}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-left text-brand-black dark:text-brand-white font-bold flex justify-between items-center"
                  >
                    <span>{filterContract}</span>
                    <span className="text-[10px] text-brand-gray">▼</span>
                  </button>
                  {activeDropdown === 'contract' && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-brand-card-dark border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl">
                      {['не важно', 'да', 'нет'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setFilterContract(c)
                            setActiveDropdown(null)
                          }}
                          className="w-full text-left py-2.5 px-4 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-brand-black dark:text-brand-white"
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
                <label className="block text-brand-gray text-[10px] uppercase mb-1">Бюджет (тенге)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="от"
                    value={formatBudgetDisplay(filterPriceFrom)}
                    onChange={(e) => setFilterPriceFrom(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold placeholder:text-brand-gray focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="до"
                    value={formatBudgetDisplay(filterPriceTo)}
                    onChange={(e) => setFilterPriceTo(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 px-4 text-brand-black dark:text-brand-white font-bold placeholder:text-brand-gray focus:outline-none"
                  />
                </div>
              </div>

              {/* Functional Toggles Row */}
              <div className="flex items-center justify-between gap-4 mt-2 py-3 border-y border-gray-150 dark:border-zinc-850">
                {/* Only Photos Switch */}
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-brand-blue" />
                  <span className="text-xs text-brand-black dark:text-brand-white font-bold">Только с фото</span>
                  <button
                    type="button"
                    onClick={() => setFilterOnlyPhotos(!filterOnlyPhotos)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                      filterOnlyPhotos ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                        filterOnlyPhotos ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Hide Viewed Switch */}
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-brand-blue" />
                  <span className="text-xs text-brand-black dark:text-brand-white font-bold">Скрыть просмотренные</span>
                  <button
                    type="button"
                    onClick={() => setFilterHideViewed(!filterHideViewed)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                      filterHideViewed ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
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
                className="flex-1 bg-blue-50 dark:bg-zinc-800 text-brand-blue dark:text-brand-white rounded-2xl py-3.5 px-4 font-bold text-center hover:bg-blue-100 dark:hover:bg-zinc-750 active:scale-98 transition-all duration-200"
              >
                Сбросить
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-brand-blue text-white rounded-2xl py-3.5 px-4 font-bold text-center hover:bg-blue-600 active:scale-98 transition-all duration-200"
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
