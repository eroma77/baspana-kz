'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'

export default function ViewedPage() {
  const { viewed } = useAppStore()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchViewed = useCallback(async () => {
    if (viewed.length === 0) {
      setListings([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', viewed)

      if (error) throw error

      const mapped = (data as Listing[]) || []
      // Sort in the exact order of 'viewed' array (most recently viewed first)
      mapped.sort((a, b) => viewed.indexOf(a.id) - viewed.indexOf(b.id))

      setListings(mapped)
    } catch (err) {
      console.error('Error fetching viewed history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [viewed])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchViewed()
    }, 0)
    return () => clearTimeout(t)
  }, [fetchViewed])

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <Header type="title" title="просмотрено" showHelpToggle={true} />

      {/* Main Container */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {isLoading ? (
          <div className="w-full py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
            <span className="text-xs text-brand-gray">Загрузка истории...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4">
            <span className="text-sm font-semibold text-brand-black dark:text-brand-white mb-1">История пуста</span>
            <span className="text-xs text-brand-gray max-w-[240px]">Здесь появятся объявления, которые вы детально просматривали</span>
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
