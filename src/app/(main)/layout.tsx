'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, setUser } = useAppStore()

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Google OAuth hash fragment handler
    const hash = window.location.hash
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (!error && data.session?.user) {
              supabase.from('profiles').select('id,email,avatar_url').eq('id', data.session.user.id).single()
                .then(({ data: profile }) => {
                  setUser(profile ?? {
                    id: data.session!.user.id,
                    email: data.session!.user.email || '',
                    avatar_url: data.session!.user.user_metadata?.avatar_url || '',
                  })
                })
              window.history.replaceState(null, '', window.location.pathname)
            }
          })
      }
    } else {
      // No OAuth redirect in progress — reconcile any stale persisted "user"
      // (e.g. the Supabase session expired) so the UI doesn't falsely show a
      // logged-in state and gate actions on a dead session.
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setUser(null)
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('id,email,avatar_url').eq('id', session.user.id).single()
        setUser(profile ?? {
          id: session.user.id,
          email: session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || '',
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [theme, setUser])

  return (
    <div
      className="h-screen h-[100dvh] w-full flex flex-col justify-start items-center overflow-hidden"
      style={{ background: 'var(--surface-container-highest)' }}
    >
      <div
        className="w-full h-full flex flex-col relative overflow-hidden sm:max-w-[430px]"
        style={{
          background: 'var(--surface)',
          borderLeft: '1px solid var(--outline-border)',
          borderRight: '1px solid var(--outline-border)',
          boxShadow: '0 0 40px rgba(0,0,0,0.08)',
        }}
      >
        <main className="flex-1 flex flex-col w-full overflow-hidden">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
