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

      {/* Main Container */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {isLoading ? (
          <div className="w-full py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
            <span className="text-xs text-brand-gray">Загрузка избранного...</span>
          </div>
        ) : favoritesListings.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4">
            <span className="text-sm font-semibold text-brand-black dark:text-brand-white mb-1">Корзина пуста</span>
            <span className="text-xs text-brand-gray max-w-[240px]">Добавляйте объявления в избранное, нажимая на сердечко</span>
          </div>
        ) : (
          <div className="flex flex-col animate-fade-in">
            {favoritesListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
