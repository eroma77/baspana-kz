'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { ListingCard } from '@/components/listing-card'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mi } from '@/components/icons'
import { useScrollRestoration } from '@/lib/use-scroll-restoration'
import { SUPPORT_WHATSAPP } from '@/lib/constants'

interface PriceSetting {
  key: string
  value: number
  label: string
}

interface Purchase {
  id: string
  listing_id: string | null
  user_email: string | null
  days: number | null
  price: number | null
  receipt_no: string | null
  receipt_url: string | null
  created_at: string
}

function parseOverpaid(receiptUrl: string | null | undefined): { paid: number; expected: number } | null {
  if (!receiptUrl?.startsWith('overpaid:')) return null
  const parts = receiptUrl.split(':')
  const paid = parseFloat(parts[1])
  const expected = parseFloat(parts[2])
  if (isNaN(paid) || isNaN(expected)) return null
  return { paid, expected }
}

export default function ProfilePage() {
  const router = useRouter()
  const scrollRef = useScrollRestoration<HTMLDivElement>()
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
  // Track which overpaid notices are dismissed (localStorage-backed)
  const [dismissedOverpaid, setDismissedOverpaid] = useState<Set<string>>(new Set())
  // Track which overpaid notices are expanded
  const [expandedOverpaid, setExpandedOverpaid] = useState<Set<string>>(new Set())

  // Delete confirmation modal state (replaces native confirm()/alert())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Admin states
  const isAdmin = user?.email === 'n.erdaullet@gmail.com'
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [prices, setPrices] = useState<PriceSetting[]>([])
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [purchases, setPurchases] = useState<Purchase[]>([])

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

  // Fetch promotion purchases (admin only) for manual reconciliation
  const fetchAdminPurchases = useCallback(async () => {
    if (!isAdmin) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return
      const res = await fetch('/api/admin/purchases', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const { data } = await res.json()
      setPurchases((data as Purchase[]) || [])
    } catch (err) {
      console.error('Error loading purchases:', err)
    }
  }, [isAdmin])

  // Save Admin Settings — via server-side API route (JWT verified server-side)
  const handleSavePrices = async (e: React.FormEvent<HTMLFormElement>) => {
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
    // Clamp to a sane range (0 – 1 000 000 ₸); ignore NaN/decimals.
    const safe = Number.isFinite(value) ? Math.min(1_000_000, Math.max(0, Math.round(value))) : 0
    setPrices((prev) =>
      prev.map((p) => (p.key === key ? { ...p, value: safe } : p))
    )
  }

  // Listing action callbacks
  const handleEditListing = (id: string) => {
    router.push(`/listing/${id}/edit`)
  }

  const handlePromoteListing = (id: string) => {
    router.push(`/listing/${id}/promote`)
  }

  const handleDeleteListing = (id: string) => {
    setDeleteError('')
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error
      // Filter out of view
      setUserListings(userListings.filter((item) => item.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting listing:', err)
      setDeleteError('Не удалось удалить объявление. Попробуйте ещё раз.')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('baspana_ov_dismissed')
      if (raw) setDismissedOverpaid(new Set(JSON.parse(raw) as string[]))
    } catch { /* ignore */ }
  }, [])

  // Close the delete-confirmation modal with the Escape key
  useEffect(() => {
    if (!deleteTarget) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) setDeleteTarget(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteTarget, isDeleting])

  const dismissOverpaid = (id: string) => {
    setDismissedOverpaid(prev => {
      const next = new Set(prev).add(id)
      try { localStorage.setItem('baspana_ov_dismissed', JSON.stringify(Array.from(next))) } catch { /* ignore */ }
      return next
    })
  }

  const toggleOverpaidExpand = (id: string) => {
    setExpandedOverpaid(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (user) {
      const t = setTimeout(() => {
        fetchUserListings()
        if (isAdmin) {
          fetchAdminPrices()
          fetchAdminPurchases()
        }
      }, 0)
      return () => clearTimeout(t)
    }
  }, [user, isAdmin, fetchUserListings, fetchAdminPrices, fetchAdminPurchases])

  // Count of active listings
  const activeCount = userListings.filter((l) => l.status === 'active').length

  return (
    <div className="flex flex-col w-full h-full">
      <Header type="title" title="мой кабинет" showHelpToggle={false} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 110px' }}>

        {/* Profile card */}
        <div style={{
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-border)',
          borderRadius: 20, padding: 20, marginBottom: 16, userSelect: 'none',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 9999, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mi name="person" size={28} color="var(--outline)" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface-variant)' }}>
                  Войдите, чтобы продолжить
                </span>
              </div>
              <button
                onClick={handleGoogleLogin}
                style={{ width: '100%', height: 44, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px' }}
              >
                Войти через Google
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 9999, overflow: 'hidden', border: '2px solid var(--outline-border)', background: 'var(--surface-container-low)', flexShrink: 0 }}>
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt="Аватар" fill sizes="56px" className="object-cover object-center" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mi name="person" size={28} color="var(--outline)" />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{ width: '100%', height: 44, background: 'var(--brand-red-soft)', color: 'var(--brand-red)', border: '1px solid var(--brand-red-border)', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px' }}
              >
                Выйти
              </button>
            </div>
          )}
        </div>

        {/* Auth content */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Admin panel */}
            {isAdmin && (
              <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-border)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container-low)', border: 'none', borderBottom: '1px solid var(--outline-border)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', letterSpacing: '-0.1px' }}>
                    <Mi name="admin_panel_settings" size={18} color="var(--brand-blue)" />
                    Панель администратора
                  </span>
                  <Mi name={showAdminPanel ? 'expand_less' : 'expand_more'} size={20} color="var(--on-surface-variant)" />
                </button>

                {showAdminPanel && (
                  <>
                  <form onSubmit={handleSavePrices} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Настройки тарифов:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {prices.map((p) => (
                        <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.label}</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number" min="0"
                              value={p.value === 0 ? '' : p.value}
                              placeholder="0"
                              onChange={(e) => handlePriceChange(p.key, e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                              style={{ width: '100%', background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', borderRadius: 12, padding: '10px 40px 10px 16px', fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: 14 }}>₸</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {adminMessage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--brand-green)' }}>
                        <Mi name="check_circle" size={16} color="var(--brand-green)" />
                        {adminMessage}
                      </div>
                    )}
                    <button
                      type="submit" disabled={isAdminSaving}
                      style={{ width: '100%', height: 44, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: isAdminSaving ? 0.7 : 1 }}
                    >
                      {isAdminSaving ? 'Сохранение…' : 'Сохранить изменения'}
                    </button>
                  </form>

                  {/* Покупки (реклама) — для ручной сверки с поступившими деньгами */}
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--outline-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 12px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Покупки (реклама)</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>{purchases.length}</span>
                    </div>
                    {purchases.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Покупок пока нет</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {purchases.map((p) => (
                          <div key={p.id} style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)' }}>{p.price ?? '—'} ₸ · {p.days ?? '—'} дн.</span>
                              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                                {new Date(p.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                              {p.receipt_no && <span>Чек: {p.receipt_no}</span>}
                              {p.listing_id && (
                                <a href={`/listing/${p.listing_id}`} style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontWeight: 600 }}>Объявление ↗</a>
                              )}
                              {p.receipt_url && (
                                <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontWeight: 600 }}>PDF ↗</a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            )}

            {/* My listings */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>Мои объявления</span>
                <div style={{ height: 28, minWidth: 28, borderRadius: 9999, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', fontSize: 13, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                  {userListings.length}
                </div>
              </div>

              {isLoadingListings ? (
                <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
                  <span style={{ fontSize: 13, color: 'var(--outline)' }}>Загрузка объявлений…</span>
                </div>
              ) : userListings.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--surface-container-lowest)', border: '1px dashed var(--outline-border)', borderRadius: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: 16, letterSpacing: '-0.2px' }}>У вас пока нет объявлений</div>
                  <button
                    onClick={() => router.push('/add')}
                    style={{ height: 40, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
                  >
                    <Mi name="add" size={18} color="#FFF" />
                    Создать первое
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activeCount >= 5 && !isAdmin && (
                    <div style={{ marginBottom: 12, background: '#E8F5E9', border: '1px solid rgba(0,150,50,0.20)', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 10 }}>
                      <Mi name="info" size={18} color="#2E7D32" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1B5E20', lineHeight: 1.4 }}>
                        Достигнут лимит объявлений. Удалите старое, чтобы опубликовать новое.
                      </span>
                    </div>
                  )}
                  {userListings.map((item) => {
                    const hasReceiptError = item.status === 'receipt_error'
                    const overpaid = parseOverpaid(item.receipt_url)
                    const overpaidDismissed = dismissedOverpaid.has(item.id)
                    const overpaidExpanded = expandedOverpaid.has(item.id)

                    return (
                      <div key={item.id} style={{ marginBottom: 16 }}>

                        {/* ── Fraud / price mismatch banner ── */}
                        {hasReceiptError && (
                          <div style={{ marginBottom: 4, background: 'var(--brand-red-soft)', border: '1px solid var(--brand-red-border)', borderRadius: '16px 16px 0 0', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Mi name="block" size={16} color="var(--brand-red)" />
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-red)', letterSpacing: '-0.1px' }}>
                                Объявление снято с публикации
                              </span>
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--brand-red)', lineHeight: 1.4 }}>
                              Причина: сумма в чеке не соответствует стоимости тарифа.
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 11, color: 'var(--brand-red)', opacity: 0.8 }}>
                                Если считаете, что это ошибка — напишите автору
                              </span>
                              <button
                                onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}`, '_blank', 'noopener,noreferrer')}
                                style={{ flexShrink: 0, background: '#25D366', color: '#FFF', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <Mi name="chat" size={14} color="#FFF" />
                                WhatsApp
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Overpaid notice (dismissable) ── */}
                        {overpaid && !overpaidDismissed && (
                          <div style={{ marginBottom: 4, background: '#FFFBE6', border: '1px solid #FFE58F', borderRadius: hasReceiptError ? 0 : '16px 16px 0 0', overflow: 'hidden' }}>
                            {/* Header row — always visible */}
                            <div
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOverpaidExpand(item.id) } }}
                              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => toggleOverpaidExpand(item.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Mi name="info" size={15} color="#B45309" />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>
                                  Вы оплатили больше, чем нужно
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Mi name={overpaidExpanded ? 'expand_less' : 'expand_more'} size={16} color="#92400E" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); dismissOverpaid(item.id) }}
                                  title="Скрыть навсегда"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#92400E', opacity: 0.6 }}
                                >
                                  <Mi name="close" size={16} color="#92400E" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {overpaidExpanded && (
                              <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>
                                  Тариф стоит <strong>{overpaid.expected} ₸</strong>, в чеке оплачено <strong>{overpaid.paid} ₸</strong>.
                                  Если это случайность и вы хотите вернуть разницу — обратитесь ко мне.
                                </span>
                                <button
                                  onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}`, '_blank', 'noopener,noreferrer')}
                                  style={{ alignSelf: 'flex-start', background: '#25D366', color: '#FFF', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                                >
                                  <Mi name="chat" size={14} color="#FFF" />
                                  Написать автору
                                </button>
                              </div>
                            )}
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
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            onClick={() => { if (!isDeleting) setDeleteTarget(null) }}
            style={{ position: 'absolute', inset: 0, background: 'var(--modal-scrim)', backdropFilter: 'blur(8px)' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 320,
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-border)',
            borderRadius: 28, padding: 24,
            boxShadow: 'var(--shadow-modal)',
            userSelect: 'none',
          }}>
            <div style={{ width: 52, height: 52, margin: '0 auto 16px', borderRadius: 9999, background: 'var(--brand-red-soft)', border: '1px solid var(--brand-red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mi name="delete" size={26} color="var(--brand-red)" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.3px' }}>
              Удалить объявление?
            </div>
            <div style={{ fontSize: 14, textAlign: 'center', color: 'var(--on-surface-variant)', lineHeight: 1.4, marginBottom: deleteError ? 12 : 20 }}>
              Это действие нельзя отменить.
            </div>
            {deleteError && (
              <div style={{ fontSize: 13, textAlign: 'center', color: 'var(--brand-red)', lineHeight: 1.4, marginBottom: 16 }}>
                {deleteError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{ flex: 1, height: 44, background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '1px solid var(--outline-border)', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: isDeleting ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px', opacity: isDeleting ? 0.6 : 1 }}
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{ flex: 1, height: 44, background: 'var(--brand-red)', color: '#FFF', border: '1px solid transparent', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: isDeleting ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px', opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? 'Удаление…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
