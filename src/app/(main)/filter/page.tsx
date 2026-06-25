'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { CITIES_DATA } from '@/lib/constants'
import { ChevronDown, Camera, Eye } from 'lucide-react'
import { Header } from '@/components/header'

// Formatting helper for budgets (spaces as thousands separators)
function formatBudgetDisplay(val: string) {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function FilterPage() {
  const router = useRouter()
  const { mode, theme, setTheme, filters, setFilters, resetFilters } = useAppStore()

  // Local state for dropdown visibility
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [priceErrors, setPriceErrors] = useState({ priceFrom: false, priceTo: false })

  // Sync active city's districts matrix
  const currentCityData = CITIES_DATA.find((c) => c.city === filters.city)
  const hasDistricts = currentCityData && currentCityData.districts.length > 0

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  const handleAgeFromSelect = (val: string) => {
    const num = parseInt(val)
    let updatedTo = filters.ageTo
    if (filters.ageTo && parseInt(filters.ageTo) < num) {
      updatedTo = val
    }
    setFilters({ ageFrom: val, ageTo: updatedTo })
    setActiveDropdown(null)
  }

  const handleAgeToSelect = (val: string) => {
    const num = parseInt(val)
    let updatedFrom = filters.ageFrom
    if (filters.ageFrom && parseInt(filters.ageFrom) > num) {
      updatedFrom = val
    }
    setFilters({ ageFrom: updatedFrom, ageTo: val })
    setActiveDropdown(null)
  }

  // Handle city selection: reset district based on mode
  const handleCitySelect = (cityVal: string) => {
    const targetCity = CITIES_DATA.find((c) => c.city === cityVal)
    const targetHasDistricts = targetCity && targetCity.districts.length > 0
    
    setFilters({
      city: cityVal,
      district: targetHasDistricts ? (mode === 'apartment' ? 'Не важно' : targetCity.districts[0]) : '-'
    })
    setActiveDropdown(null)
  }

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-[#F7F7F7] dark:bg-[#202020] w-full h-full overflow-hidden select-none font-montserrat transition-colors duration-200 ease-in-out">
      
      {/* Header */}
      <Header
        type="title"
        title="фильтр"
        showBack={true}
        backUrl="/"
        showThemeToggle={true}
        showHelpToggle={true}
      />

      {/* Fields grid scroll container */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 text-[16px] font-normal">
        
        {/* Error banner */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-[#FF3662] rounded-xl p-4 flex gap-3 leading-relaxed text-xs">
            <span>{errorMsg}</span>
          </div>
        )}
        
        {/* Row 1: Город & Пол */}
        <div className="grid grid-cols-2 gap-3">
          {/* City Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('city')}
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.city
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">{filters.city || 'Город'}</span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'city' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                <button
                  type="button"
                  onClick={() => handleCitySelect('')}
                  className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white border-b border-zinc-200/10 dark:border-zinc-800/10 transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  Все города
                </button>
                {CITIES_DATA.map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => handleCitySelect(c.city)}
                    className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
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
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.gender !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">{filters.gender === 'Не важно' ? 'Пол' : filters.gender}</span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'gender' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                {['Не важно', 'Парень', 'Девушка'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setFilters({ gender: g })
                      setActiveDropdown(null)
                    }}
                    className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
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
            className={`w-full border rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
              hasDistricts
                ? filters.district && filters.district !== 'Не важно' && filters.district !== '-'
                  ? 'bg-[#FFFFFF] dark:bg-[#313131] border-gray-200 dark:border-zinc-800 text-[#000000] dark:text-white font-semibold'
                  : 'bg-[#FFFFFF] dark:bg-[#313131] border-gray-200 dark:border-zinc-800 text-[#9D9D9D] font-normal'
                : 'bg-[#F7F7F7] dark:bg-[#202020] border-zinc-200 dark:border-zinc-800 text-[#9D9D9D] opacity-50 cursor-not-allowed font-normal'
            }`}
          >
            <span className="truncate">
              {!hasDistricts
                ? '-'
                : filters.district === 'Не важно'
                ? 'Район'
                : filters.district}
            </span>
            <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
          </button>
          {activeDropdown === 'district' && hasDistricts && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
              {mode === 'apartment' && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ district: 'Не важно' })
                    setActiveDropdown(null)
                  }}
                  className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  Не важно
                </button>
              )}
              {currentCityData?.districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setFilters({ district: d })
                    setActiveDropdown(null)
                  }}
                  className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Возраст & Комната */}
        <div className="grid grid-cols-2 gap-3">
          {mode === 'apartment' ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('ageFrom')}
                className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                  filters.ageFrom && filters.ageFrom !== 'Не важно'
                    ? 'text-[#000000] dark:text-white font-semibold'
                    : 'text-[#9D9D9D] font-normal'
                }`}
              >
                <span className="truncate">
                  {filters.ageFrom === 'Не важно' || !filters.ageFrom ? 'Возраст автора' : filters.ageFrom}
                </span>
                <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
              </button>
              {activeDropdown === 'ageFrom' && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                  {['Не важно', ...Array.from({ length: 35 }, (_, i) => `${16 + i} лет`)].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setFilters({ ageFrom: a, ageTo: a })
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl min-h-[44px] text-[16px] relative select-none">
              <div className="pl-3 pr-2 flex items-center shrink-0">
                <span className="text-[16px]">🎂</span>
              </div>
              <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800/80"></div>
              {/* Age From */}
              <div className="relative flex-1 h-full">
                <button
                  type="button"
                  onClick={() => toggleDropdown('ageFrom')}
                  className={`w-full h-full py-2.5 px-2 text-center flex justify-between items-center text-[16px] cursor-pointer ${
                    filters.ageFrom ? 'text-[#000000] dark:text-white font-semibold' : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="w-full text-center">{filters.ageFrom || 'от'}</span>
                  <span className="text-[10px] text-[#9D9D9D] shrink-0">▼</span>
                </button>
                {activeDropdown === 'ageFrom' && (
                  <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {Array.from(
                      { length: (filters.ageTo ? parseInt(filters.ageTo) : 50) - 16 + 1 },
                      (_, i) => (16 + i).toString()
                    ).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleAgeFromSelect(a)}
                        className="w-full text-center py-2 px-3 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-150 cursor-pointer"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800/80"></div>
              {/* Age To */}
              <div className="relative flex-1 h-full">
                <button
                  type="button"
                  onClick={() => toggleDropdown('ageTo')}
                  className={`w-full h-full py-2.5 px-2 text-center flex justify-between items-center text-[16px] cursor-pointer ${
                    filters.ageTo ? 'text-[#000000] dark:text-white font-semibold' : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="w-full text-center">{filters.ageTo || 'до'}</span>
                  <span className="text-[10px] text-[#9D9D9D] shrink-0">▼</span>
                </button>
                {activeDropdown === 'ageTo' && (
                  <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {Array.from(
                      { length: 50 - (filters.ageFrom ? parseInt(filters.ageFrom) : 16) + 1 },
                      (_, i) => ((filters.ageFrom ? parseInt(filters.ageFrom) : 16) + i).toString()
                    ).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleAgeToSelect(a)}
                        className="w-full text-center py-2 px-3 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-150 cursor-pointer"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rooms Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('rooms')}
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.rooms !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">
                {filters.rooms === 'Не важно' ? 'Комната' : filters.rooms}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'rooms' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                {['Не важно', '1-комнатный', '2-комнатный', '3-комнатный', '4-комнатный', '5-комнатный', '6-комнатный', '7-комнатный', '8-комнатный', '9-комнатный', '10+-комнатный'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setFilters({ rooms: r })
                      setActiveDropdown(null)
                    }}
                    className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                  >
                    {r}
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
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.peopleCount !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">
                {filters.peopleCount === 'Не важно' ? 'Общий:' : filters.peopleCount}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'peopleCount' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                {mode === 'roommate' ? (
                  ['Не важно', ...Array.from({ length: 9 }, (_, i) => `Общий: ${i + 1}`), 'Общий: 10+'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFilters({ peopleCount: p })
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                    >
                      {p}
                    </button>
                  ))
                ) : (
                  ['Не важно', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFilters({ peopleCount: p })
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                    >
                      {p}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Searching Count Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('searchingCount')}
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.searchingCount !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">
                {filters.searchingCount === 'Не важно' ? 'Нас:' : filters.searchingCount}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'searchingCount' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                {mode === 'roommate' ? (
                  ['Не важно', ...Array.from({ length: 9 }, (_, i) => `Нас: ${i + 1}`), 'Нас: 10+'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setFilters({ searchingCount: s })
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                    >
                      {s}
                    </button>
                  ))
                ) : (
                  ['Не важно', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setFilters({ searchingCount: s })
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 5: С кем могу жить (Always visible) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('canLiveWith')}
            className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
              filters.canLiveWith !== 'Не важно'
                ? 'text-[#000000] dark:text-white font-semibold'
                : 'text-[#9D9D9D] font-normal'
            }`}
          >
            <span className="truncate">
              {filters.canLiveWith === 'Не важно' ? 'Могу жить с' : filters.canLiveWith}
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
                    setFilters({ canLiveWith: item })
                    setActiveDropdown(null)
                  }}
                  className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 6: Депозит & Договор */}
        <div className="grid grid-cols-2 gap-3">
          {/* Deposit Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('deposit')}
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.deposit !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">
                {filters.deposit === 'Не важно' ? 'Депозит' : `Депозит: ${filters.deposit}`}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'deposit' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                {['Не важно', 'Есть', 'Нет'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setFilters({ deposit: d })
                      setActiveDropdown(null)
                    }}
                    className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
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
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.contract !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">
                {filters.contract === 'Не важно' ? 'Договор' : `Договор: ${filters.contract}`}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'contract' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                {['Не важно', 'Есть', 'Нет'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setFilters({ contract: c })
                      setActiveDropdown(null)
                    }}
                    className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 6.5: Срок проживания (roommate only) */}
        {mode === 'roommate' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('term')}
              className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                filters.term && filters.term !== 'Не важно'
                  ? 'text-[#000000] dark:text-white font-semibold'
                  : 'text-[#9D9D9D] font-normal'
              }`}
            >
              <span className="truncate">
                {filters.term === 'Не важно' || !filters.term ? 'Срок проживания' : filters.term}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
            </button>
            {activeDropdown === 'term' && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                {['Не важно', ...Array.from({ length: 12 }, (_, i) => `${i + 1} месяц`)].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFilters({ term: t })
                      setActiveDropdown(null)
                    }}
                    className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row 7: Бюджет от / до */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="От"
            value={formatBudgetDisplay(filters.priceFrom)}
            onChange={(e) => {
              setFilters({ priceFrom: e.target.value.replace(/\D/g, '') })
              setPriceErrors((prev) => ({ ...prev, priceFrom: false }))
              setErrorMsg('')
            }}
            className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border rounded-xl py-3 px-4 text-left placeholder:text-[#9D9D9D] focus:outline-none min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
              priceErrors.priceFrom ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-800'
            } ${
              filters.priceFrom
                ? 'text-[#000000] dark:text-white font-semibold'
                : 'text-[#9D9D9D] font-normal'
            }`}
          />
          <input
            type="text"
            placeholder="До"
            value={formatBudgetDisplay(filters.priceTo)}
            onChange={(e) => {
              setFilters({ priceTo: e.target.value.replace(/\D/g, '') })
              setPriceErrors((prev) => ({ ...prev, priceTo: false }))
              setErrorMsg('')
            }}
            className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border rounded-xl py-3 px-4 text-left placeholder:text-[#9D9D9D] focus:outline-none min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
              priceErrors.priceTo ? 'border-[#FF3662]' : 'border-gray-200 dark:border-zinc-800'
            } ${
              filters.priceTo
                ? 'text-[#000000] dark:text-white font-semibold'
                : 'text-[#9D9D9D] font-normal'
            }`}
          />
        </div>

        {/* Row 8: Toggles (Only Photos / Hide Viewed) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Only Photos Toggle */}
          <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
            <Camera className={`w-5 h-5 transition-colors duration-200 ease-in-out ${filters.onlyPhotos ? 'text-[#007BFF]' : 'text-[#9D9D9D]'}`} />
            <button
              type="button"
              onClick={() => setFilters({ onlyPhotos: !filters.onlyPhotos })}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${
                filters.onlyPhotos ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'
              }`}
            >
              <div
                className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  filters.onlyPhotos ? 'translate-x-4' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Hide Viewed Toggle */}
          <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
            <Eye className={`w-5 h-5 transition-colors duration-200 ease-in-out ${filters.hideViewed ? 'text-[#007BFF]' : 'text-[#9D9D9D]'}`} />
            <button
              type="button"
              onClick={() => setFilters({ hideViewed: !filters.hideViewed })}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${
                filters.hideViewed ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'
              }`}
            >
              <div
                className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  filters.hideViewed ? 'translate-x-4' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions Footer */}
      <div className="w-full p-5 flex justify-between gap-3 shrink-0 bg-transparent transition-all duration-200 ease-in-out">
        <button
          onClick={() => {
            resetFilters()
            setActiveDropdown(null)
          }}
          className="flex-1 bg-[#007BFF]/10 text-[#007BFF] rounded-xl py-3.5 px-4 font-bold text-center hover:bg-[#007BFF]/20 active:scale-[0.98] transition-all duration-200 ease-in-out text-[16px] cursor-pointer"
        >
          Сбросить
        </button>
        <button
          onClick={() => {
            setErrorMsg('')
            const errs = { priceFrom: false, priceTo: false }
            let hasError = false
            
            const fromVal = filters.priceFrom ? parseInt(filters.priceFrom) : 0
            const toVal = filters.priceTo ? parseInt(filters.priceTo) : 0
            
            if (filters.priceFrom && (fromVal < 10000 || fromVal > 900000)) {
              errs.priceFrom = true
              setErrorMsg('Бюджет должен быть от 10 000 ₸ до 900 000 ₸.')
              hasError = true
            }

            if (filters.priceTo && (toVal < 10000 || toVal > 900000)) {
              errs.priceTo = true
              setErrorMsg('Бюджет должен быть от 10 000 ₸ до 900 000 ₸.')
              hasError = true
            }

            if (filters.priceFrom && filters.priceTo && fromVal > toVal) {
              errs.priceFrom = true
              errs.priceTo = true
              setErrorMsg('Минимальный бюджет (от) не может быть больше максимального (до).')
              hasError = true
            }
            
            if (hasError) {
              setPriceErrors(errs)
              return
            }
            
            router.push('/')
          }}
          className="flex-1 bg-[#007BFF] text-[#FFFFFF] rounded-xl py-3.5 px-4 font-bold text-center hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 ease-in-out text-[16px] cursor-pointer"
        >
          Применить
        </button>
      </div>
    </div>
  )
}
