'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Mi } from '@/components/icons'

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
      // Cleanup runs at most once per day — not on every page load
      const CLEANUP_KEY = 'baspana_last_cleanup'
      const lastCleanup = localStorage.getItem(CLEANUP_KEY)
      const now = Date.now()
      if (!lastCleanup || now - parseInt(lastCleanup) > 24 * 60 * 60 * 1000) {
        supabase.rpc('cleanup_listings').then(() => {
          localStorage.setItem(CLEANUP_KEY, String(now))
        })
      }

      if (fetchId !== fetchCounter.current) return

      // Build database query with limit for performance
      let query = supabase
        .from('listings')
        .select('id,owner_id,mode,city,district,gender,age_from,age_to,rooms,can_live_with,people_count,searching_count,term,total_people,deposit,contract,price_from,price_to,photos,description,phone,address_link,is_premium,premium_until,status,transaction_id,receipt_url,created_at,updated_at')
        .eq('mode', mode === 'apartment' ? 'roommate' : 'apartment')
        .eq('status', 'active')
        .limit(100)

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

  // Listen for sort trigger from Header toolbar
  useEffect(() => {
    const open = () => setShowSort(true)
    window.addEventListener('bp:sort', open)
    return () => window.removeEventListener('bp:sort', open)
  }, [])

  const SORT_OPTIONS = [
    { label: 'Сначала новые', value: 'newest' },
    { label: 'Сначала старые', value: 'oldest' },
    { label: 'Низкая цена',   value: 'price_asc' },
    { label: 'Высокая цена',  value: 'price_desc' },
  ] as const

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header includes mode toggle + filter/sort/theme/help toolbar */}
      <Header type="mode-toggle" showThemeToggle showHelpToggle />

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 110px' }}>
        {isLoading && listings.length === 0 ? (
          <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
            <span style={{ fontSize: 13, color: 'var(--outline)' }}>Загрузка объявлений…</span>
          </div>
        ) : listings.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 18px', borderRadius: 9999,
              background: 'var(--surface-container-low)',
              border: '1px solid var(--outline-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mi name="search_off" size={32} color="var(--outline)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.3px' }}>
              Ничего не найдено
            </div>
            <div style={{ fontSize: 15, color: 'var(--on-surface-variant)', maxWidth: 280, margin: '0 auto', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
              Попробуйте изменить параметры фильтрации
            </div>
          </div>
        ) : (
          listings.map((item, index) => (
            <ListingCard key={item.id} listing={item} isFirst={index === 0} />
          ))
        )}
      </div>

      {/* Sort modal */}
      {showSort && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div
            onClick={() => setShowSort(false)}
            style={{ position: 'absolute', inset: 0, background: 'var(--modal-scrim)', backdropFilter: 'blur(8px)' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 300,
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-border)',
            borderRadius: 28, padding: 20,
            boxShadow: 'var(--shadow-modal)',
            userSelect: 'none',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center', color: 'var(--on-surface)', marginBottom: 16, letterSpacing: '-0.3px' }}>
              Сортировка
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {SORT_OPTIONS.map((opt) => {
                const selected = sortBy === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    style={{
                      width: '100%', height: 44, borderRadius: 16,
                      background: selected ? 'var(--brand-blue-soft)' : 'var(--surface-container-low)',
                      border: `1px solid ${selected ? 'rgba(0,67,200,0.20)' : 'var(--outline-border)'}`,
                      color: selected ? 'var(--brand-blue)' : 'var(--on-surface)',
                      fontSize: 14, fontWeight: selected ? 600 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 12,
                      letterSpacing: '-0.1px',
                    }}
                  >
                    <Mi
                      name={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      size={18}
                      color={selected ? 'var(--brand-blue)' : 'var(--outline)'}
                    />
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleApplySort}
              style={{
                width: '100%', height: 44,
                background: 'var(--brand-blue-container)', color: '#FFF',
                border: '1px solid rgba(0,67,200,0.20)', borderRadius: 16,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '-0.1px',
              }}
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
