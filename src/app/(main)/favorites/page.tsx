'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'

export default function FavoritesPage() {
  const { favorites, favoritesListings, setFavoritesListings, toggleFavorite } = useAppStore()
  const hasPreloaded = favoritesListings.length > 0
  const [isLoading, setIsLoading] = useState(!hasPreloaded)
  const [isReversed, setIsReversed] = useState(false)

  const fetchFavorites = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoritesListings([])
      setIsLoading(false)
      return
    }

    const storeState = useAppStore.getState()
    const hasPreloadedCurrent = storeState.favoritesListings.length > 0
    if (!hasPreloadedCurrent) {
      setIsLoading(true)
    }
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', favorites)

      if (error) throw error
      
      // Sort favorites in order of the ID list (newest or reversed)
      const mapped = (data as Listing[]) || []
      mapped.sort((a, b) => {
        const order = favorites.indexOf(a.id) - favorites.indexOf(b.id)
        return isReversed ? -order : order
      })

      // #8 Favorites sync: remove IDs of listings that no longer exist in DB
      // (owner deleted the listing — clean up stale favorites automatically)
      const existingIds = new Set(mapped.map((l) => l.id))
      const staleIds = storeState.favorites.filter((id) => !existingIds.has(id))
      staleIds.forEach((id) => toggleFavorite(id))
      
      setFavoritesListings(mapped)
    } catch (err) {
      console.error('Error fetching favorites:', err)
    } finally {
      setIsLoading(false)
    }
  }, [favorites, isReversed, setFavoritesListings, toggleFavorite])

  // Listen to header sort click event
  useEffect(() => {
    const handleToggleSort = () => {
      setIsReversed((prev) => !prev)
    }
    window.addEventListener('toggle-favorites-sort', handleToggleSort)
    return () => window.removeEventListener('toggle-favorites-sort', handleToggleSort)
  }, [])

  // Refetch when favorites array or sort direction updates
  useEffect(() => {
    const t = setTimeout(() => {
      fetchFavorites()
    }, 0)
    return () => clearTimeout(t)
  }, [fetchFavorites])

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <Header type="title" title="корзина" showHelpToggle={true} />

      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 110px' }}>
        {isLoading ? (
          <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
            <span style={{ fontSize: 13, color: 'var(--outline)' }}>Загрузка избранного…</span>
          </div>
        ) : favoritesListings.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 9999, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 32, color: 'var(--outline)' }}>favorite_border</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.3px' }}>Корзина пуста</div>
            <div style={{ fontSize: 15, color: 'var(--on-surface-variant)', maxWidth: 280, margin: '0 auto', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
              Добавляйте объявления, нажимая на сердечко
            </div>
          </div>
        ) : (
          favoritesListings.map((item) => <ListingCard key={item.id} listing={item} />)
        )}
      </div>
    </div>
  )
}
