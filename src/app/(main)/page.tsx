'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { CITIES_DATA } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Mi } from '@/components/icons'

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-border)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div className="animate-pulse" style={{ width: '100%', height: 140, background: 'var(--surface-container-low)' }} />
      <div style={{ padding: 12 }}>
        <div className="animate-pulse" style={{ height: 28, width: '55%', borderRadius: 8, background: 'var(--surface-container-low)', marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px', marginBottom: 14 }}>
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} className="animate-pulse" style={{ height: 34, borderRadius: 8, background: 'var(--surface-container-low)' }} />
          ))}
        </div>
        <div className="animate-pulse" style={{ height: 40, borderRadius: 16, background: 'var(--surface-container-low)' }} />
      </div>
    </div>
  )
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
        void supabase.rpc('cleanup_listings').then(() => {
          localStorage.setItem(CLEANUP_KEY, String(now))
        })
      }

      if (fetchId !== fetchCounter.current) return

      // Build URL params for the cached listings API
      const params = new URLSearchParams()
      params.set('mode', mode === 'apartment' ? 'roommate' : 'apartment')
      if (filters.city) params.set('city', filters.city)
      if (hasDistricts && filters.district !== 'Не важно' && filters.district !== '-')
        params.set('district', filters.district)
      if (filters.gender && filters.gender !== 'Не важно')
        params.set('gender', filters.gender)
      if (filters.rooms && filters.rooms !== 'Не важно')
        params.set('rooms', filters.rooms)
      if (filters.deposit === 'Есть' || filters.deposit === 'Нет')
        params.set('deposit', filters.deposit)
      if (filters.contract === 'Есть' || filters.contract === 'Нет')
        params.set('contract', filters.contract)
      if (filters.canLiveWith && filters.canLiveWith !== 'Не важно')
        params.set('canLiveWith', filters.canLiveWith)
      if (filters.term && filters.term !== 'Не важно')
        params.set('term', filters.term)
      if (filters.priceFrom) params.set('priceFrom', filters.priceFrom.replace(/\D/g, ''))
      if (filters.priceTo) params.set('priceTo', filters.priceTo.replace(/\D/g, ''))

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (!res.ok) throw new Error(`Listings fetch failed: ${res.status}`)
      if (fetchId !== fetchCounter.current) return
      const data = await res.json() as Listing[]

      let result = data || []

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
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
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
