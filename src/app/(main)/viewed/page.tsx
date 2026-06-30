'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { useScrollRestoration } from '@/lib/use-scroll-restoration'

export default function ViewedPage() {
  const { viewed, viewedListings, setViewedListings } = useAppStore()
  const scrollRef = useScrollRestoration<HTMLDivElement>()
  const hasPreloaded = viewedListings.length > 0
  const [isLoading, setIsLoading] = useState(!hasPreloaded)

  const fetchViewed = useCallback(async () => {
    if (viewed.length === 0) {
      setViewedListings([])
      setIsLoading(false)
      return
    }

    const storeState = useAppStore.getState()
    const hasPreloadedCurrent = storeState.viewedListings.length > 0
    if (!hasPreloadedCurrent) {
      setIsLoading(true)
    }
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', viewed)

      if (error) throw error

      const mapped = (data as Listing[]) || []
      // Sort in the exact order of 'viewed' array (most recently viewed first)
      mapped.sort((a, b) => viewed.indexOf(a.id) - viewed.indexOf(b.id))

      setViewedListings(mapped)
    } catch (err) {
      console.error('Error fetching viewed history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [viewed, setViewedListings])

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

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '16px 20px 110px' }}>
        {isLoading ? (
          <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
            <span style={{ fontSize: 13, color: 'var(--outline)' }}>Загрузка истории…</span>
          </div>
        ) : viewedListings.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 9999, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 32, color: 'var(--outline)' }}>radar</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.3px' }}>История пуста</div>
            <div style={{ fontSize: 15, color: 'var(--on-surface-variant)', maxWidth: 280, margin: '0 auto', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
              Здесь появятся объявления, которые вы просматривали
            </div>
          </div>
        ) : (
          viewedListings.map((item) => <ListingCard key={item.id} listing={item} />)
        )}
      </div>
    </div>
  )
}
