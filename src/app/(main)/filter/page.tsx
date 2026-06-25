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
  const { mode, setMode, theme, setTheme, filters, setFilters, resetFilters } = useAppStore()

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
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-[#FF3662] rounded-xl p-4 flex gap-3 leading-relaxed text-xs shrink-0">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab-dependent Filters */}
        {mode === 'apartment' ? (
          <>
            {/* --- Вкладка «Ищу квартиру» (параметры КВАРТИРЫ) --- */}

            {/* Строка 1: Город & Комнат */}
            <div className="grid grid-cols-2 gap-3">
              {/* Город */}
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
                    {CITIES_DATA.map((c) => (
                      <button key={c.city} type="button" onClick={() => handleCitySelect(c.city)} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{c.city}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Комнат */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.rooms && filters.rooms !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">{filters.rooms && filters.rooms !== 'Не важно' ? filters.rooms : 'Комнат'}</span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'rooms' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {['1-комнатный', '2-комнатный', '3-комнатный', '4-комнатный', '5-комнатный', '6-комнатный', '7-комнатный', '8-комнатный', '9-комнатный', '10+-комнатный'].map((r) => (
                      <button key={r} type="button" onClick={() => { setFilters({ rooms: r }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{r}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Строка 2: Район */}
            <div className="relative">
              <button
                type="button"
                disabled={!hasDistricts}
                onClick={() => toggleDropdown('district')}
                className={`w-full border rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out ${
                  hasDistricts
                    ? filters.district && filters.district !== 'Не важно' && filters.district !== '-'
                      ? 'bg-[#FFFFFF] dark:bg-[#313131] border-gray-200 dark:border-zinc-800 text-[#000000] dark:text-white font-semibold cursor-pointer'
                      : 'bg-[#FFFFFF] dark:bg-[#313131] border-gray-200 dark:border-zinc-800 text-[#9D9D9D] font-normal cursor-pointer'
                    : 'bg-[#F7F7F7] dark:bg-[#202020] border-zinc-200 dark:border-zinc-800 text-[#9D9D9D] opacity-50 cursor-not-allowed font-normal'
                }`}
              >
                <span className="truncate">
                  {!hasDistricts
                    ? 'Район'
                    : filters.district === 'Не важно' || !filters.district || filters.district === '-'
                    ? 'Не важно'
                    : filters.district}
                </span>
                <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
              </button>
              {activeDropdown === 'district' && hasDistricts && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                  <button type="button" onClick={() => { setFilters({ district: 'Не важно' }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">Не важно</button>
                  {currentCityData?.districts.map((d) => (
                    <button key={d} type="button" onClick={() => { setFilters({ district: d }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{d}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Строка 3: Возраст & Пол сожителей */}
            <div className="grid grid-cols-2 gap-3">
              {/* Возраст (16–50 лет) */}
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
                    {filters.ageFrom && filters.ageFrom !== 'Не важно' ? filters.ageFrom : 'Возраст'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'ageFrom' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {Array.from({ length: 35 }, (_, i) => `${16 + i} лет`).map((a) => (
                      <button key={a} type="button" onClick={() => { setFilters({ ageFrom: a, ageTo: a }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{a}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Пол сожителей (canLiveWith) */}
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
                    {filters.canLiveWith === 'Не важно' ? 'Пол сожителей' : filters.canLiveWith}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'canLiveWith' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['Не важно', 'Только парни', 'Только девочки'].map((item) => (
                      <button key={item} type="button" onClick={() => { setFilters({ canLiveWith: item }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{item}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Строка 4: Депозит & Договор */}
            <div className="grid grid-cols-2 gap-3">
              {/* Депозит */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('deposit')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.deposit && filters.deposit !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.deposit && filters.deposit !== 'Не важно' ? filters.deposit : 'Депозит'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'deposit' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['Есть', 'Нет'].map((d) => (
                      <button key={d} type="button" onClick={() => { setFilters({ deposit: d }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{d}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Договор */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.contract && filters.contract !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.contract && filters.contract !== 'Не важно' ? filters.contract : 'Договор'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'contract' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['Есть', 'Нет'].map((c) => (
                      <button key={c} type="button" onClick={() => { setFilters({ contract: c }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{c}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Строка 5: Ищет & Общий */}
            <div className="grid grid-cols-2 gap-3">
              {/* Ищет (searchingCount) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('searchingCount')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.searchingCount && filters.searchingCount !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.searchingCount && filters.searchingCount !== 'Не важно' ? `Ищет: ${filters.searchingCount}` : 'Ищет'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'searchingCount' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((s) => (
                      <button key={s} type="button" onClick={() => { setFilters({ searchingCount: s }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{s}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Общий (peopleCount) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('peopleCount')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.peopleCount && filters.peopleCount !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.peopleCount && filters.peopleCount !== 'Не важно' ? `Общий: ${filters.peopleCount}` : 'Общий'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'peopleCount' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((p) => (
                      <button key={p} type="button" onClick={() => { setFilters({ peopleCount: p }); setActiveDropdown(null) }} className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer">{p}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* --- Вкладка «Ищу соседа» (параметры ЧЕЛОВЕКА) --- */}
            
            {/* Строка 1: Город & Пол автора */}
            <div className="grid grid-cols-2 gap-3">
              {/* Город (city) */}
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

              {/* Пол автора (gender) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('gender')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.gender && filters.gender !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.gender && filters.gender !== 'Не важно' ? filters.gender : 'Пол'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'gender' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['Парень', 'Девушка'].map((g) => (
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

            {/* Строка 2: Район (Disabled if empty) */}
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
                    ? 'Район'
                    : filters.district === 'Не важно' || !filters.district || filters.district === '-'
                    ? 'Не важно'
                    : filters.district}
                </span>
                <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
              </button>
              {activeDropdown === 'district' && hasDistricts && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
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

            {/* Строка 3: Возраст от & до */}
            <div className="grid grid-cols-2 gap-3">
              {/* Возраст от */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('ageFrom')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.ageFrom
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.ageFrom ? `от ${filters.ageFrom} лет` : 'от 16 лет'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'ageFrom' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {Array.from({ length: 35 }, (_, i) => 16 + i).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          const toVal = filters.ageTo ? parseInt(filters.ageTo) : 50
                          setFilters({ ageFrom: String(a), ageTo: toVal < a ? String(a) : filters.ageTo })
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                      >
                        {a} лет
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Возраст до */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('ageTo')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.ageTo
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.ageTo ? `до ${filters.ageTo} лет` : 'до 50 лет'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'ageTo' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {Array.from({ length: 35 }, (_, i) => 16 + i).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          const fromVal = filters.ageFrom ? parseInt(filters.ageFrom) : 16
                          setFilters({ ageTo: String(a), ageFrom: fromVal > a ? String(a) : filters.ageFrom })
                          setActiveDropdown(null)
                        }}
                        className="w-full text-left py-2.5 px-4 text-[16px] font-bold hover:bg-zinc-50 dark:hover:bg-[#202020] text-zinc-900 dark:text-white transition-colors duration-200 ease-in-out cursor-pointer"
                      >
                        {a} лет
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Строка 3b: Комнатность */}
            <div className="grid grid-cols-2 gap-3">
              {/* Комнатность (rooms) */}
              <div className="relative col-span-1">
                <button
                  type="button"
                  onClick={() => toggleDropdown('rooms')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.rooms && filters.rooms !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.rooms && filters.rooms !== 'Не важно' ? filters.rooms : 'Комнатность'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'rooms' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['1-комнатный', '2-комнатный', '3-комнатный', '4-комнатный', '5-комнатный', '6-комнатный', '7-комнатный', '8-комнатный', '9-комнатный', '10+-комнатный'].map((r) => (
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

            {/* Строка 4: Могу жить с & Нас (без префикса, просто числа) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Могу жить с (canLiveWith) */}
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
                    {filters.canLiveWith === 'Не важно' ? 'Может жить с' : filters.canLiveWith}
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

              {/* Нас (searchingCount) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('searchingCount')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.searchingCount && filters.searchingCount !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.searchingCount && filters.searchingCount !== 'Не важно' ? filters.searchingCount : 'Нас'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'searchingCount' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((s) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Строка 5: Срок & Общее количество людей (без префикса, просто числа) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Срок проживания (term) */}
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
                    {Array.from({ length: 12 }, (_, i) => `${i + 1} месяц`).map((t) => (
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

              {/* Общее количество людей (peopleCount) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('peopleCount')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.peopleCount && filters.peopleCount !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.peopleCount && filters.peopleCount !== 'Не важно' ? filters.peopleCount : 'Общее количество людей'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'peopleCount' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-80 overflow-y-auto transition-all duration-200 ease-in-out">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((p) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Строка 6: Депозит & Договор */}
            <div className="grid grid-cols-2 gap-3">
              {/* Депозит */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('deposit')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.deposit && filters.deposit !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.deposit && filters.deposit !== 'Не важно' ? `Депозит: ${filters.deposit}` : 'Депозит'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'deposit' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['Есть', 'Нет'].map((d) => (
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

              {/* Договор */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('contract')}
                  className={`w-full bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-left flex justify-between items-center min-h-[44px] text-[16px] transition-all duration-200 ease-in-out cursor-pointer ${
                    filters.contract && filters.contract !== 'Не важно'
                      ? 'text-[#000000] dark:text-white font-semibold'
                      : 'text-[#9D9D9D] font-normal'
                  }`}
                >
                  <span className="truncate">
                    {filters.contract && filters.contract !== 'Не важно' ? `Договор: ${filters.contract}` : 'Договор'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#9D9D9D] shrink-0" />
                </button>
                {activeDropdown === 'contract' && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl transition-all duration-200 ease-in-out">
                    {['Есть', 'Нет'].map((c) => (
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
          </>
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

        {/* Row 8: Toggles */}
        {mode === 'apartment' ? (
          // Apartment: only «Просмотрено» toggle (full width)
          <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
            <span className="text-[16px] text-[#9D9D9D] font-normal select-none">Просмотрено</span>
            <button
              type="button"
              onClick={() => setFilters({ hideViewed: !filters.hideViewed })}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${
                filters.hideViewed ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'
              }`}
            >
              <div className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${filters.hideViewed ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>
        ) : (
          // Roommate: both toggles
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
              <Camera className={`w-5 h-5 transition-colors duration-200 ease-in-out ${filters.onlyPhotos ? 'text-[#007BFF]' : 'text-[#9D9D9D]'}`} />
              <button type="button" onClick={() => setFilters({ onlyPhotos: !filters.onlyPhotos })} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${filters.onlyPhotos ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'}`}>
                <div className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${filters.onlyPhotos ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#313131] border border-gray-200 dark:border-zinc-800 rounded-xl py-3 px-4 min-h-[44px] transition-all duration-200 ease-in-out">
              <Eye className={`w-5 h-5 transition-colors duration-200 ease-in-out ${filters.hideViewed ? 'text-[#007BFF]' : 'text-[#9D9D9D]'}`} />
              <button type="button" onClick={() => setFilters({ hideViewed: !filters.hideViewed })} className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${filters.hideViewed ? 'bg-[#007BFF]' : 'bg-gray-200 dark:bg-zinc-800'}`}>
                <div className={`bg-[#FFFFFF] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${filters.hideViewed ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        )}
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
