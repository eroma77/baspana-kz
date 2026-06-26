'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, Settings, Plus, Flame, ShieldAlert, CheckCircle, Info } from 'lucide-react'

interface PriceSetting {
  key: string
  value: number
  label: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { 
    user, 
    setUser, 
    userListings, 
    setUserListings, 
    hasFetchedUserListings, 
    setHasFetchedUserListings 
  } = useAppStore()

  // Authorized user states
  const [isLoadingListings, setIsLoadingListings] = useState(!hasFetchedUserListings)

  // Admin states
  const isAdmin = user?.email === 'n.erdaullet@gmail.com'
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [prices, setPrices] = useState<PriceSetting[]>([])
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')

  // Google Login action
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Error logging in:', err)
    }
  }

  // Logout action
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setUserListings([])
      setHasFetchedUserListings(false)
    } catch (err) {
      console.error('Error logging out:', err)
    }
  }

  // Fetch listings for current user
  const fetchUserListings = useCallback(async () => {
    if (!user) return
    const storeState = useAppStore.getState()
    if (!storeState.hasFetchedUserListings) {
      setIsLoadingListings(true)
    }
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      const result = (data as Listing[]) || []
      setUserListings(result)
      setHasFetchedUserListings(true)
    } catch (err) {
      console.error('Error fetching user listings:', err)
    } finally {
      setIsLoadingListings(false)
    }
  }, [user, setUserListings, setHasFetchedUserListings])

  // Fetch Admin Settings — via server-side API route (JWT verified server-side)
  const fetchAdminPrices = useCallback(async () => {
    if (!isAdmin) return
    try {
      // Get real JWT from Supabase session — cannot be faked via localStorage
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('No active session')

      const res = await fetch('/api/admin/prices', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Server error')
      }

      const { data } = await res.json()
      setPrices((data as PriceSetting[]) || [])
    } catch (err) {
      console.error('Error loading admin settings:', err)
    }
  }, [isAdmin])

  // Save Admin Settings — via server-side API route (JWT verified server-side)
  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdminSaving(true)
    setAdminMessage('')
    try {
      // Get real JWT from Supabase session
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('No active session')

      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prices: prices.map((p) => ({ key: p.key, value: p.value })),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Server error')
      }

      setAdminMessage('Цены успешно обновлены!')
      setTimeout(() => setAdminMessage(''), 3000)
    } catch (err) {
      console.error('Error saving admin settings:', err)
      setAdminMessage('Ошибка сохранения настроек.')
    } finally {
      setIsAdminSaving(false)
    }
  }

  const handlePriceChange = (key: string, value: number) => {
    setPrices((prev) =>
      prev.map((p) => (p.key === key ? { ...p, value: Math.max(0, value) } : p))
    )
  }

  // Listing action callbacks
  const handleEditListing = (id: string) => {
    router.push(`/listing/${id}/edit`)
  }

  const handlePromoteListing = (id: string) => {
    router.push(`/listing/${id}/promote`)
  }

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Вы уверены, что хотите навсегда удалить это объявление?')) return
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (error) throw error
      // Filter out of view
      setUserListings(userListings.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Error deleting listing:', err)
      alert('Ошибка при удалении объявления.')
    }
  }

  useEffect(() => {
    if (user) {
      const t = setTimeout(() => {
        fetchUserListings()
        if (isAdmin) {
          fetchAdminPrices()
        }
      }, 0)
      return () => clearTimeout(t)
    }
  }, [user, isAdmin, fetchUserListings, fetchAdminPrices])

  // Count of active listings
  const activeCount = userListings.filter((l) => l.status === 'active').length

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <Header type="title" title="мой кабинет" showHelpToggle={false} />

      {/* Main Content */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        
        {/* Profile Card block */}
        <div className="bg-white dark:bg-[#313131] rounded-3xl p-5 border border-gray-200 dark:border-zinc-700/50 shadow-sm mb-5 select-none transition-colors duration-200">
          {!user ? (
            <div className="flex flex-col gap-4">
              {/* Horizontal layout: icon + email */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-zinc-800 border-2 border-[#007BFF]/30 flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-[#007BFF]" />
                </div>
                <span className="text-sm font-semibold text-[#9D9D9D] truncate">
                  Войдите, чтобы продолжить
                </span>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full bg-[#007BFF] text-white rounded-2xl py-3.5 font-bold hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                Войти через Google
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Horizontal layout: avatar + email */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#007BFF]/30 bg-blue-50 dark:bg-zinc-800 shrink-0">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Аватар"
                      fill
                      sizes="56px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#007BFF]">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {user.email}
                </span>
              </div>

              {/* Logout Button (Малиновый #FF3662) */}
              <button
                onClick={handleLogout}
                className="w-full bg-[#FF3662] text-white rounded-2xl py-3.5 font-bold hover:bg-red-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                Выйти
              </button>
            </div>
          )}
        </div>


        {/* Auth users content */}
        {user && (
          <div className="flex flex-col gap-6">
            
            {/* ADMIN PANEL GUARD SECTION */}
            {isAdmin && (
              <div className="bg-white dark:bg-brand-card-dark rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs">
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="w-full px-5 py-4 flex items-center justify-between font-bold text-xs uppercase tracking-wider text-brand-black dark:text-brand-white bg-zinc-50 dark:bg-zinc-850 border-b border-gray-150 dark:border-zinc-800"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-brand-blue" />
                    Панель администратора
                  </span>
                  <span>{showAdminPanel ? '▲' : '▼'}</span>
                </button>

                {showAdminPanel && (
                  <form onSubmit={handleSavePrices} className="p-5 flex flex-col gap-4 text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Настройки тарифов цен:</span>
                    
                    <div className="flex flex-col gap-3">
                      {prices.map((p) => (
                        <div key={p.key} className="flex flex-col gap-1">
                          <label className="text-brand-gray text-[10px] uppercase font-bold">{p.label}</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={p.value === 0 ? '' : p.value}
                              placeholder="0"
                              onChange={(e) => handlePriceChange(p.key, e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-xl py-2.5 pl-4 pr-10 font-bold text-brand-black dark:text-brand-white focus:outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-brand-gray">₸</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {adminMessage && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 dark:text-green-400 mt-1">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {adminMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAdminSaving}
                      className="w-full bg-brand-blue text-white rounded-xl py-3.5 font-bold hover:bg-blue-600 active:scale-95 transition-all duration-150 text-xs mt-2"
                    >
                      {isAdminSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* MY LISTINGS BANNER ROW */}
            <div className="flex flex-col">
              {/* Header Banner — black capsule as per Figma */}
              <div className="w-[338px] mx-auto flex items-center justify-between px-5 py-3.5 rounded-full bg-black dark:bg-zinc-900 border border-zinc-800 shadow-sm select-none mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#007BFF] flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-white text-white" />
                  </div>
                  <span className="font-bold text-sm text-white lowercase tracking-wide">
                    мои объявления
                  </span>
                </div>

                {/* Count Badge */}
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center font-extrabold text-sm text-black dark:text-white">
                  {userListings.length}
                </div>
              </div>

              {/* Warnings and listings layout */}
              <div className="flex flex-col">
                {isLoadingListings ? (
                  <div className="w-full py-12 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
                    <span className="text-xs text-brand-gray">Загрузка ваших объявлений...</span>
                  </div>
                ) : userListings.length === 0 ? (
                  <div className="w-[338px] mx-auto py-10 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-xs font-semibold text-brand-black dark:text-brand-white mb-3">
                      У вас пока нет объявлений
                    </span>
                    <button
                      onClick={() => router.push('/add')}
                      className="bg-brand-blue text-white rounded-full py-2.5 px-5 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Создать первое
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Exceeded listings warning — not shown to admin */}
                    {activeCount >= 5 && !isAdmin && (
                      <div className="w-[338px] mx-auto mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-2xl p-4 flex gap-3 text-xs select-none">
                        <Info className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-green-800 dark:text-green-300 font-semibold leading-relaxed">
                          Максимальное количество достигнуто. Чтобы опубликовать новое объявление, удалите старое.
                        </span>
                      </div>
                    )}

                    {/* Listings render list */}
                    {userListings.map((item) => {
                      // Check for payment / validation error status
                      const hasReceiptError = item.status === 'receipt_error'
                      return (
                        <div key={item.id} className="flex flex-col w-[338px] mx-auto mb-4">
                          {hasReceiptError && (
                            <div className="mb-2 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-t-2xl p-3 flex justify-between items-center text-[11px] font-bold">
                              <span>Ошибка публикации из-за неверного чека</span>
                              <button
                                onClick={() => window.open('https://wa.me/77718359057', '_blank')}
                                className="bg-brand-red text-white py-1 px-3 rounded-full hover:bg-red-600 transition-colors"
                              >
                                Связаться
                              </button>
                            </div>
                          )}
                          <ListingCard
                            listing={item}
                            isOwnerView={true}
                            onEdit={handleEditListing}
                            onPromote={handlePromoteListing}
                            onDelete={handleDeleteListing}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
