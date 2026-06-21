'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { ArrowUpDown } from 'lucide-react'

export default function FavoritesPage() {
  const { favorites } = useAppStore()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFavorites = async () => {
    if (favorites.length === 0) {
      setListings([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', favorites)

      if (error) throw error
      
      // Sort favorites in order of the ID list (so newest added remains in place)
      const mapped = (data as Listing[]) || []
      mapped.sort((a, b) => favorites.indexOf(a.id) - favorites.indexOf(b.id))
      
      setListings(mapped)
    } catch (err) {
      console.error('Error fetching favorites:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch when favorites array updates
  useEffect(() => {
    fetchFavorites()
  }, [favorites])

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
        ) : listings.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4">
            <span className="text-sm font-semibold text-brand-black dark:text-brand-white mb-1">Корзина пуста</span>
            <span className="text-xs text-brand-gray max-w-[240px]">Добавляйте объявления в избранное, нажимая на сердечко</span>
          </div>
        ) : (
          <div className="flex flex-col animate-fade-in">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
