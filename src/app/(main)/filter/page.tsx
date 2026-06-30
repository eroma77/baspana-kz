'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { CITIES_DATA } from '@/lib/constants'
import { Mi } from '@/components/icons'
import { Header } from '@/components/header'

const AGE_OPTIONS = Array.from({ length: 35 }, (_, i) => 16 + i)
const TERM_OPTIONS = Array.from({ length: 12 }, (_, i) => `${i + 1} месяц`)

function formatBudgetDisplay(val: string) {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const FIELD: CSSProperties = {
  background: 'var(--surface-container-low)',
  border: '1px solid var(--outline-border)',
  borderRadius: 12,
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: 44,
  fontSize: 16,
  cursor: 'pointer',
  width: '100%',
  fontFamily: 'inherit',
  transition: 'all 200ms var(--ease)',
}

const FIELD_INPUT: CSSProperties = {
  background: 'var(--surface-container-low)',
  border: '1px solid var(--outline-border)',
  borderRadius: 12,
  padding: '12px 16px',
  minHeight: 44,
  fontSize: 16,
  width: '100%',
  fontFamily: 'inherit',
  transition: 'all 200ms var(--ease)',
  boxSizing: 'border-box',
}

const DROPDOWN: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 50,
  marginTop: 4,
  background: 'var(--surface-container-low)',
  border: '1px solid var(--outline-border)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-modal)',
  maxHeight: 320,
  overflowY: 'auto',
}

const OPT: CSSProperties = {
  padding: '10px 16px',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--on-surface)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
  textAlign: 'left',
  display: 'block',
}

const TOGGLE: CSSProperties = {
  width: 36, height: 20, borderRadius: 9999, padding: 2,
  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
  transition: 'background 200ms var(--ease)',
}

const TOGGLE_THUMB: CSSProperties = {
  width: 16, height: 16, borderRadius: 9999, background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  transition: 'transform 200ms var(--ease)',
}

function fieldText(active: boolean): CSSProperties {
  return { color: active ? 'var(--on-surface)' : 'var(--secondary)', fontWeight: active ? 600 : 400 }
}

export default function FilterPage() {
  const router = useRouter()
  const { mode, filters, setFilters, resetFilters } = useAppStore()

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [priceErrors, setPriceErrors] = useState({ priceFrom: false, priceTo: false })

  const currentCityData = CITIES_DATA.find((c) => c.city === filters.city)
  const hasDistricts = !!(currentCityData && currentCityData.districts.length > 0)

  const toggleDropdown = (name: string) => setActiveDropdown(activeDropdown === name ? null : name)

  const handleCitySelect = (cityVal: string) => {
    const targetCity = CITIES_DATA.find((c) => c.city === cityVal)
    const targetHasDistricts = targetCity && targetCity.districts.length > 0
    setFilters({
      city: cityVal,
      district: targetHasDistricts ? (mode === 'apartment' ? 'Не важно' : targetCity.districts[0]) : '-',
    })
    setActiveDropdown(null)
  }

  function DropOpt({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button type="button" onClick={onClick} style={OPT} className="filter-opt">
        {label}
      </button>
    )
  }

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col w-full h-full overflow-hidden select-none"
      style={{ background: 'var(--surface)' }}
    >
      <Header
        type="title"
        title="фильтр"
        showBack={true}
        backUrl="/"
        showThemeToggle={true}
        showHelpToggle={true}
      />

      {/* Click-away layer: closes any open dropdown when tapping outside it */}
      {activeDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 flex flex-col gap-4">

        {errorMsg && (
          <div style={{
            background: 'var(--brand-red-soft)', border: '1px solid var(--brand-red)',
            borderRadius: 12, padding: '12px 16px', color: 'var(--brand-red-text)', fontSize: 12,
          }}>
            {errorMsg}
          </div>
        )}

        {mode === 'apartment' ? (
          <>
            {/* Row 1: City & Rooms */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('city')} style={{ ...FIELD, ...fieldText(!!filters.city) }}>
                  <span className="truncate">{filters.city || 'Город'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'city' && (
                  <div style={DROPDOWN}>
                    {CITIES_DATA.map((c) => <DropOpt key={c.city} label={c.city} onClick={() => handleCitySelect(c.city)} />)}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('rooms')} style={{ ...FIELD, ...fieldText(!!(filters.rooms && filters.rooms !== 'Не важно')) }}>
                  <span className="truncate">{filters.rooms && filters.rooms !== 'Не важно' ? filters.rooms : 'Комнат'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'rooms' && (
                  <div style={DROPDOWN}>
                    {['1-комнатный','2-комнатный','3-комнатный','4-комнатный','5-комнатный','6-комнатный','7-комнатный','8-комнатный','9-комнатный','10+-комнатный'].map((r) => (
                      <DropOpt key={r} label={r} onClick={() => { setFilters({ rooms: r }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: District & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button
                  type="button"
                  disabled={!hasDistricts}
                  onClick={() => toggleDropdown('district')}
                  style={{
                    ...FIELD,
                    ...(hasDistricts
                      ? fieldText(!!(filters.district && filters.district !== 'Не важно' && filters.district !== '-'))
                      : { color: 'var(--secondary)', opacity: 0.5, cursor: 'not-allowed' }),
                  }}
                >
                  <span className="truncate">
                    {!hasDistricts ? 'Район'
                      : (filters.district === 'Не важно' || !filters.district || filters.district === '-') ? 'Не важно'
                      : filters.district}
                  </span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'district' && hasDistricts && (
                  <div style={DROPDOWN}>
                    <DropOpt label="Не важно" onClick={() => { setFilters({ district: 'Не важно' }); setActiveDropdown(null) }} />
                    {currentCityData?.districts.map((d) => (
                      <DropOpt key={d} label={d} onClick={() => { setFilters({ district: d }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('gender')} style={{ ...FIELD, ...fieldText(!!(filters.gender && filters.gender !== 'Не важно')) }}>
                  <span className="truncate">{filters.gender && filters.gender !== 'Не важно' ? filters.gender : 'Пол'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'gender' && (
                  <div style={DROPDOWN}>
                    {['Парень','Девушка'].map((g) => <DropOpt key={g} label={g} onClick={() => { setFilters({ gender: g }); setActiveDropdown(null) }} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Age & CanLiveWith */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('ageFrom')} style={{ ...FIELD, ...fieldText(!!(filters.ageFrom && filters.ageFrom !== 'Не важно')) }}>
                  <span className="truncate">{filters.ageFrom && filters.ageFrom !== 'Не важно' ? `${parseInt(filters.ageFrom)} лет` : 'Возраст'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'ageFrom' && (
                  <div style={DROPDOWN}>
                    {AGE_OPTIONS.map((a) => (
                      <DropOpt key={a} label={`${a} лет`} onClick={() => { setFilters({ ageFrom: String(a), ageTo: String(a) }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('canLiveWith')} style={{ ...FIELD, ...fieldText(filters.canLiveWith !== 'Не важно') }}>
                  <span className="truncate">{filters.canLiveWith === 'Не важно' ? 'Пол сожителей' : filters.canLiveWith}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'canLiveWith' && (
                  <div style={DROPDOWN}>
                    {['Не важно','Только парни','Только девочки'].map((item) => (
                      <DropOpt key={item} label={item} onClick={() => { setFilters({ canLiveWith: item }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Deposit & Contract */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('deposit')} style={{ ...FIELD, ...fieldText(!!(filters.deposit && filters.deposit !== 'Не важно')) }}>
                  <span className="truncate">{filters.deposit && filters.deposit !== 'Не важно' ? filters.deposit : 'Депозит'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'deposit' && (
                  <div style={DROPDOWN}>
                    {['Есть','Нет'].map((d) => <DropOpt key={d} label={d} onClick={() => { setFilters({ deposit: d }); setActiveDropdown(null) }} />)}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('contract')} style={{ ...FIELD, ...fieldText(!!(filters.contract && filters.contract !== 'Не важно')) }}>
                  <span className="truncate">{filters.contract && filters.contract !== 'Не важно' ? filters.contract : 'Договор'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'contract' && (
                  <div style={DROPDOWN}>
                    {['Есть','Нет'].map((c) => <DropOpt key={c} label={c} onClick={() => { setFilters({ contract: c }); setActiveDropdown(null) }} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Row 5: SearchingCount & PeopleCount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('searchingCount')} style={{ ...FIELD, ...fieldText(!!(filters.searchingCount && filters.searchingCount !== 'Не важно')) }}>
                  <span className="truncate">{filters.searchingCount && filters.searchingCount !== 'Не важно' ? `Ищет: ${filters.searchingCount}` : 'Ищет'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'searchingCount' && (
                  <div style={DROPDOWN}>
                    {['1','2','3','4','5','6','7','8','9','10+'].map((s) => (
                      <DropOpt key={s} label={s} onClick={() => { setFilters({ searchingCount: s }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('peopleCount')} style={{ ...FIELD, ...fieldText(!!(filters.peopleCount && filters.peopleCount !== 'Не важно')) }}>
                  <span className="truncate">{filters.peopleCount && filters.peopleCount !== 'Не важно' ? `Общий: ${filters.peopleCount}` : 'Общий'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'peopleCount' && (
                  <div style={DROPDOWN}>
                    {['1','2','3','4','5','6','7','8','9','10+'].map((p) => (
                      <DropOpt key={p} label={p} onClick={() => { setFilters({ peopleCount: p }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* --- ROOMMATE MODE --- */}

            {/* Row 1: City & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('city')} style={{ ...FIELD, ...fieldText(!!filters.city) }}>
                  <span className="truncate">{filters.city || 'Город'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'city' && (
                  <div style={DROPDOWN}>
                    {CITIES_DATA.map((c) => <DropOpt key={c.city} label={c.city} onClick={() => handleCitySelect(c.city)} />)}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('gender')} style={{ ...FIELD, ...fieldText(!!(filters.gender && filters.gender !== 'Не важно')) }}>
                  <span className="truncate">{filters.gender && filters.gender !== 'Не важно' ? filters.gender : 'Пол'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'gender' && (
                  <div style={DROPDOWN}>
                    {['Парень','Девушка'].map((g) => <DropOpt key={g} label={g} onClick={() => { setFilters({ gender: g }); setActiveDropdown(null) }} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: District */}
            <div className="relative">
              <button
                type="button"
                disabled={!hasDistricts}
                onClick={() => toggleDropdown('district')}
                style={{
                  ...FIELD,
                  ...(hasDistricts
                    ? fieldText(!!(filters.district && filters.district !== 'Не важно' && filters.district !== '-'))
                    : { color: 'var(--secondary)', opacity: 0.5, cursor: 'not-allowed' }),
                }}
              >
                <span className="truncate">
                  {!hasDistricts ? 'Район'
                    : (filters.district === 'Не важно' || !filters.district || filters.district === '-') ? 'Не важно'
                    : filters.district}
                </span>
                <Mi name="expand_more" size={18} color="var(--secondary)" />
              </button>
              {activeDropdown === 'district' && hasDistricts && (
                <div style={DROPDOWN}>
                  {currentCityData?.districts.map((d) => (
                    <DropOpt key={d} label={d} onClick={() => { setFilters({ district: d }); setActiveDropdown(null) }} />
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Age from & to */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('ageFrom')} style={{ ...FIELD, ...fieldText(!!filters.ageFrom) }}>
                  <span className="truncate">{filters.ageFrom ? `от ${filters.ageFrom} лет` : 'от 16 лет'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'ageFrom' && (
                  <div style={DROPDOWN}>
                    {AGE_OPTIONS.map((a) => (
                      <DropOpt key={a} label={`${a} лет`} onClick={() => {
                        const toVal = filters.ageTo ? parseInt(filters.ageTo) : 50
                        setFilters({ ageFrom: String(a), ageTo: toVal < a ? String(a) : filters.ageTo })
                        setActiveDropdown(null)
                      }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('ageTo')} style={{ ...FIELD, ...fieldText(!!filters.ageTo) }}>
                  <span className="truncate">{filters.ageTo ? `до ${filters.ageTo} лет` : 'до 50 лет'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'ageTo' && (
                  <div style={DROPDOWN}>
                    {Array.from({ length: 35 }, (_, i) => 16 + i).map((a) => (
                      <DropOpt key={a} label={`${a} лет`} onClick={() => {
                        const fromVal = filters.ageFrom ? parseInt(filters.ageFrom) : 16
                        setFilters({ ageTo: String(a), ageFrom: fromVal > a ? String(a) : filters.ageFrom })
                        setActiveDropdown(null)
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3b: Rooms */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative col-span-2">
                <button type="button" onClick={() => toggleDropdown('rooms')} style={{ ...FIELD, ...fieldText(!!(filters.rooms && filters.rooms !== 'Не важно')) }}>
                  <span className="truncate">{filters.rooms && filters.rooms !== 'Не важно' ? filters.rooms : 'Комнатность'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'rooms' && (
                  <div style={DROPDOWN}>
                    {['1-комнатный','2-комнатный','3-комнатный','4-комнатный','5-комнатный','6-комнатный','7-комнатный','8-комнатный','9-комнатный','10+-комнатный'].map((r) => (
                      <DropOpt key={r} label={r} onClick={() => { setFilters({ rooms: r }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: CanLiveWith & SearchingCount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('canLiveWith')} style={{ ...FIELD, ...fieldText(filters.canLiveWith !== 'Не важно') }}>
                  <span className="truncate">{filters.canLiveWith === 'Не важно' ? 'Может жить с' : filters.canLiveWith}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'canLiveWith' && (
                  <div style={DROPDOWN}>
                    {['Не важно','Только парни','Только девочки'].map((item) => (
                      <DropOpt key={item} label={item} onClick={() => { setFilters({ canLiveWith: item }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('searchingCount')} style={{ ...FIELD, ...fieldText(!!(filters.searchingCount && filters.searchingCount !== 'Не важно')) }}>
                  <span className="truncate">{filters.searchingCount && filters.searchingCount !== 'Не важно' ? filters.searchingCount : 'Нас'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'searchingCount' && (
                  <div style={DROPDOWN}>
                    {['1','2','3','4','5','6','7','8','9','10+'].map((s) => (
                      <DropOpt key={s} label={s} onClick={() => { setFilters({ searchingCount: s }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 5: Term & PeopleCount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('term')} style={{ ...FIELD, ...fieldText(!!(filters.term && filters.term !== 'Не важно')) }}>
                  <span className="truncate">{filters.term === 'Не важно' || !filters.term ? 'Срок' : filters.term}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'term' && (
                  <div style={DROPDOWN}>
                    {TERM_OPTIONS.map((t) => (
                      <DropOpt key={t} label={t} onClick={() => { setFilters({ term: t }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('peopleCount')} style={{ ...FIELD, ...fieldText(!!(filters.peopleCount && filters.peopleCount !== 'Не важно')) }}>
                  <span className="truncate">{filters.peopleCount && filters.peopleCount !== 'Не важно' ? filters.peopleCount : 'Всего жильцов'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'peopleCount' && (
                  <div style={DROPDOWN}>
                    {['1','2','3','4','5','6','7','8','9','10+'].map((p) => (
                      <DropOpt key={p} label={p} onClick={() => { setFilters({ peopleCount: p }); setActiveDropdown(null) }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 6: Deposit & Contract */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('deposit')} style={{ ...FIELD, ...fieldText(!!(filters.deposit && filters.deposit !== 'Не важно')) }}>
                  <span className="truncate">{filters.deposit && filters.deposit !== 'Не важно' ? `Депозит: ${filters.deposit}` : 'Депозит'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'deposit' && (
                  <div style={DROPDOWN}>
                    {['Есть','Нет'].map((d) => <DropOpt key={d} label={d} onClick={() => { setFilters({ deposit: d }); setActiveDropdown(null) }} />)}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => toggleDropdown('contract')} style={{ ...FIELD, ...fieldText(!!(filters.contract && filters.contract !== 'Не важно')) }}>
                  <span className="truncate">{filters.contract && filters.contract !== 'Не важно' ? `Договор: ${filters.contract}` : 'Договор'}</span>
                  <Mi name="expand_more" size={18} color="var(--secondary)" />
                </button>
                {activeDropdown === 'contract' && (
                  <div style={DROPDOWN}>
                    {['Есть','Нет'].map((c) => <DropOpt key={c} label={c} onClick={() => { setFilters({ contract: c }); setActiveDropdown(null) }} />)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Budget inputs */}
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
            className="focus:outline-none"
            style={{
              ...FIELD_INPUT,
              border: `1px solid ${priceErrors.priceFrom ? 'var(--brand-red)' : 'var(--outline-border)'}`,
              color: filters.priceFrom ? 'var(--on-surface)' : 'var(--secondary)',
              fontWeight: filters.priceFrom ? 600 : 400,
            }}
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
            className="focus:outline-none"
            style={{
              ...FIELD_INPUT,
              border: `1px solid ${priceErrors.priceTo ? 'var(--brand-red)' : 'var(--outline-border)'}`,
              color: filters.priceTo ? 'var(--on-surface)' : 'var(--secondary)',
              fontWeight: filters.priceTo ? 600 : 400,
            }}
          />
        </div>

        {/* Toggles */}
        {mode === 'apartment' ? (
          <div style={{ ...FIELD, cursor: 'default' }}>
            <span style={{ color: 'var(--secondary)', fontSize: 16 }}>Просмотрено</span>
            <button
              type="button"
              onClick={() => setFilters({ hideViewed: !filters.hideViewed })}
              style={{ ...TOGGLE, background: filters.hideViewed ? 'var(--brand-blue)' : 'var(--surface-container-highest)' }}
            >
              <div style={{ ...TOGGLE_THUMB, transform: filters.hideViewed ? 'translateX(16px)' : 'translateX(0)' }} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div style={{ ...FIELD, cursor: 'default' }}>
              <Mi name="photo_camera" size={20} color={filters.onlyPhotos ? 'var(--brand-blue)' : 'var(--secondary)'} />
              <button
                type="button"
                onClick={() => setFilters({ onlyPhotos: !filters.onlyPhotos })}
                style={{ ...TOGGLE, background: filters.onlyPhotos ? 'var(--brand-blue)' : 'var(--surface-container-highest)' }}
              >
                <div style={{ ...TOGGLE_THUMB, transform: filters.onlyPhotos ? 'translateX(16px)' : 'translateX(0)' }} />
              </button>
            </div>
            <div style={{ ...FIELD, cursor: 'default' }}>
              <Mi name="visibility" size={20} color={filters.hideViewed ? 'var(--brand-blue)' : 'var(--secondary)'} />
              <button
                type="button"
                onClick={() => setFilters({ hideViewed: !filters.hideViewed })}
                style={{ ...TOGGLE, background: filters.hideViewed ? 'var(--brand-blue)' : 'var(--surface-container-highest)' }}
              >
                <div style={{ ...TOGGLE_THUMB, transform: filters.hideViewed ? 'translateX(16px)' : 'translateX(0)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="w-full p-5 flex gap-3 shrink-0">
        <button
          onClick={() => { resetFilters(); setActiveDropdown(null) }}
          style={{
            flex: 1, background: 'var(--brand-blue-soft)', color: 'var(--brand-blue)',
            borderRadius: 12, padding: '14px 16px', fontWeight: 700, fontSize: 16,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
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
            if (hasError) { setPriceErrors(errs); return }
            router.push('/')
          }}
          style={{
            flex: 1, background: 'var(--brand-blue)', color: '#fff',
            borderRadius: 12, padding: '14px 16px', fontWeight: 700, fontSize: 16,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Применить
        </button>
      </div>
    </div>
  )
}
