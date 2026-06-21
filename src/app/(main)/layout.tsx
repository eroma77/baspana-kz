'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const { theme, setUser } = useAppStore()

  useEffect(() => {
    setMounted(true)
    // Synchronize HTML theme class on client mount
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
        } else {
          // If profile table entry is not populated yet, write a fallback
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [theme, setUser])

  // Simple loading skeleton while hydrating client state to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-start items-center">
      <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col pb-24 relative shadow-md border-x border-gray-200 dark:border-zinc-800 transition-colors duration-200">
        <main className="flex-1 flex flex-col w-full">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}

