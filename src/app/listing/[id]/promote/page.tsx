'use client'

import React, { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/header'
import { useAppStore, Listing } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import { Mi } from '@/components/icons'
import { KASPI_PAY_URL } from '@/lib/constants'

interface PageProps {
  params: Promise<{ id: string }>
}

interface PriceSetting {
  key: string
  value: number
}

export default function PromotePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const { user } = useAppStore()

  const [listing, setListing] = useState<Listing | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({
    price_3_days_top: 190,
    price_7_days_top: 490,
    price_30_days_top: 590,
  })
  const [selectedTariff, setSelectedTariff] = useState<'3_days' | '7_days' | '30_days'>('3_days')
  const [isLoading, setIsLoading] = useState(true)

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/profile')
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (listingError) throw listingError
        const ld = listingData as Listing
        if (ld.owner_id !== user.id) {
          router.push('/profile')
          return
        }
        setListing(ld)

        const { data: settingsData, error: settingsError } = await supabase
          .from('app_settings')
          .select('key,value')

        if (settingsError) throw settingsError

        if (settingsData) {
          const pricingMap: Record<string, number> = {}
          settingsData.forEach((s: PriceSetting) => {
            pricingMap[s.key] = s.value
          })
          setPrices((prev) => ({ ...prev, ...pricingMap }))
        }
      } catch (err) {
        console.error('Error loading promote details:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, user, router])

  if (isLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
      </div>
    )
  }

  const handlePayClick = () => {
    window.open(KASPI_PAY_URL, '_blank', 'noopener,noreferrer')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadReceipt = async () => {
    if (!file || !listing) return
    setIsUploading(true)
    setStatusMessage('Проверяем чек…')

    const days = selectedTariff === '30_days' ? 30 : selectedTariff === '7_days' ? 7 : 3

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token ?? ''

      const formData = new FormData()
      formData.append('receipt', file)
      formData.append('listingId', listing.id)
      formData.append('days', String(days))

      // Premium is now activated SERVER-SIDE only after the receipt passes
      // verification — the client can no longer self-grant premium without paying.
      const res = await fetch('/api/verify-receipt', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const result = await res.json()

      if (res.ok && result.verified) {
        setIsSuccess(true)
        setStatusMessage(
          result.overpaid
            ? 'Чек принят (оплачено больше тарифа). Объявление добавлено в ТОП!'
            : 'Чек принят! Объявление добавлено в ТОП.'
        )
      } else {
        const reasonMap: Record<string, string> = {
          'File too small': 'Файл слишком маленький — это не настоящий чек.',
          'Duplicate file': 'Этот чек уже был использован ранее.',
          'Modified PDF': 'PDF был изменён после создания.',
          'Invalid PDF': 'Файл не является корректным PDF.',
          'Not a Kaspi receipt': 'Это не чек Kaspi (нет слова «Kaspi»).',
          'Receipt too old': 'Чек устарел — оплатите и загрузите свежий чек (в течение 10 минут).',
          'Receipt date in future': 'Дата в чеке из будущего — некорректный чек.',
          'Suspicious PDF creator': 'PDF создан в редакторе изображений — не банковский чек.',
          'Wrong merchant': 'Чек выдан другому получателю.',
          'Duplicate transaction': 'Эта транзакция уже использована для другого объявления.',
          'No amount found': 'Не удалось распознать сумму в чеке.',
          'Price mismatch': 'Сумма в чеке не совпадает со стоимостью тарифа.',
        }
        setStatusMessage(
          result.error
            || reasonMap[result.reason as string]
            || `Чек не прошёл проверку (${result.reason || 'причина неизвестна'}).`
        )
      }
    } catch (err) {
      console.error('Error during receipt verification:', err)
      setStatusMessage('Ошибка при проверке чека. Попробуйте ещё раз.')
    } finally {
      setIsUploading(false)
    }
  }

  const tariffs = [
    {
      key: '3_days' as const,
      label: '3 дня в ТОПЕ',
      sub: '100+ просмотров в день',
      oldPrice: '390 ₸',
      price: prices.price_3_days_top,
      accent: 'var(--brand-blue)',
      soft: 'var(--brand-blue-soft)',
      priceBg: 'var(--brand-blue-container)',
    },
    {
      key: '7_days' as const,
      label: '7 дней в ТОПЕ',
      sub: '250+ просмотров в день',
      oldPrice: '690 ₸',
      price: prices.price_7_days_top,
      accent: 'var(--brand-blue)',
      soft: 'var(--brand-blue-soft)',
      priceBg: 'var(--brand-blue-container)',
    },
    {
      key: '30_days' as const,
      label: '30 дней в ТОПЕ',
      sub: 'Максимальный охват',
      oldPrice: '790 ₸',
      price: prices.price_30_days_top,
      accent: 'var(--violet-promo)',
      soft: '#EDE7F6',
      priceBg: 'var(--violet-promo)',
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', width: '100%', background: 'var(--surface-container-highest)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 390, minHeight: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--outline-border)', borderRight: '1px solid var(--outline-border)', boxShadow: '0 0 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', paddingBottom: 48, userSelect: 'none' }}>

        <Header type="title" title="рекламировать" showBack={true} showHelpToggle={false} />

        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Выберите тариф продвижения
            </span>
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', maxWidth: 280, lineHeight: 1.55 }}>
              Объявления в ТОПе выводятся в самом верху ленты и получают в 10 раз больше просмотров
            </span>
          </div>

          {/* Tariff cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tariffs.map((t) => {
              const selected = selectedTariff === t.key
              return (
                <div
                  key={t.key}
                  onClick={() => setSelectedTariff(t.key)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTariff(t.key) } }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${t.label} — ${t.price} ₸`}
                  style={{
                    borderRadius: 20,
                    padding: 18,
                    border: `1px solid ${selected ? t.accent : 'var(--outline-border)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: selected ? t.soft : 'var(--surface-container-lowest)',
                    transition: 'all 180ms ease',
                    transform: selected ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: selected ? `0 0 0 1px ${t.accent}33` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, paddingRight: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: selected ? t.accent : 'var(--on-surface)', textTransform: 'lowercase' }}>{t.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: selected ? t.accent : 'var(--on-surface-variant)', opacity: selected ? 0.75 : 1 }}>{t.sub}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-red)', textDecoration: 'line-through', opacity: 0.8 }}>{t.oldPrice}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: selected ? t.priceBg : 'var(--surface-container)', color: selected ? '#FFF' : 'var(--on-surface)' }}>
                      {t.price} ₸
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Payment section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
            {!isSuccess ? (
              <>
                <button
                  onClick={handlePayClick}
                  style={{ width: '100%', height: 52, background: 'var(--brand-red)', color: '#FFF', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, letterSpacing: '-0.1px' }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mi name="payments" size={14} color="#FFF" />
                  </div>
                  Оплатить через Kaspi
                </button>

                {/* PDF upload zone */}
                <div style={{ position: 'relative', border: '1.5px dashed var(--outline-border)', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-low)', textAlign: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    disabled={isUploading}
                  />
                  <Mi name="upload_file" size={32} color="var(--brand-blue)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                    {file ? file.name : 'Загрузите чек Каспи (PDF)'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', maxWidth: 220, lineHeight: 1.5 }}>
                    {file
                      ? `Размер: ${(file.size / 1024 / 1024).toFixed(2)} МБ`
                      : 'После оплаты скачайте квитанцию в PDF и загрузите её сюда'}
                  </span>
                </div>

                {file && (
                  <button
                    onClick={handleUploadReceipt}
                    disabled={isUploading}
                    style={{ width: '100%', height: 48, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: isUploading ? 0.7 : 1 }}
                  >
                    {isUploading ? 'Проверка...' : 'Активировать рекламу'}
                  </button>
                )}

                {statusMessage && (
                  <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#D97706', padding: '4px 0', lineHeight: 1.5 }}>
                    {statusMessage}
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
                <Mi name="check_circle" size={48} color="var(--brand-green)" filled />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Успешная активация!
                </span>
                <span style={{ fontSize: 12, color: 'var(--brand-green)', fontWeight: 600, maxWidth: 260, lineHeight: 1.55 }}>
                  Чек успешно принят. Ваше объявление мгновенно добавлено в ТОП и поднято в ленте.
                </span>
                <button
                  onClick={() => router.push('/profile')}
                  style={{ marginTop: 6, background: 'var(--brand-green)', color: '#FFF', border: 'none', borderRadius: 20, padding: '10px 24px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Вернуться в кабинет
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
