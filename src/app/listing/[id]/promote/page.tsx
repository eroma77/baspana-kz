'use client'

import React, { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/header'
import { useAppStore, Listing } from '@/store/useAppStore'
import { useRouter } from 'next/navigation'
import { UploadCloud, CheckCircle2, Coins } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

interface PriceSetting {
  key: string
  value: number
  label: string
}

export default function PromotePage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { user, theme } = useAppStore()

  // App state
  const [listing, setListing] = useState<Listing | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({
    price_3_days_top: 190,
    price_7_days_top: 490,
    price_30_days_top: 590,
  })
  const [selectedTariff, setSelectedTariff] = useState<'3_days' | '7_days' | '30_days'>('3_days')
  const [isLoading, setIsLoading] = useState(true)

  // Upload/payment state
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Auth guard shield
    if (!user) {
      router.push('/profile')
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        // Fetch listing
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (listingError) throw listingError
        setListing(listingData as Listing)

        // Fetch dynamic pricing
        const { data: settingsData, error: settingsError } = await supabase
          .from('app_settings')
          .select('*')

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
      <div className="min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col justify-start items-center">
        <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
          <span className="text-xs text-brand-gray">Загрузка тарифов...</span>
        </div>
      </div>
    )
  }

  const handlePayClick = () => {
    // Open Kaspi payment link in new window
    window.open('https://pay.kaspi.kz/pay/3jtoh0vh', '_blank')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadReceipt = async () => {
    if (!file || !listing) return
    setIsUploading(true)
    setStatusMessage('Загрузка чека и активация услуги...')
    
    // Determine target tariff details
    let days = 3
    let tariffPrice = prices.price_3_days_top
    if (selectedTariff === '7_days') {
      days = 7
      tariffPrice = prices.price_7_days_top
    } else if (selectedTariff === '30_days') {
      days = 30
      tariffPrice = prices.price_30_days_top
    }

    const premiumUntilDate = new Date()
    premiumUntilDate.setDate(premiumUntilDate.getDate() + days)

    try {
      // 1. INSTANT APPROVAL MECHANICS:
      // Update listing in Supabase immediately to active status and set premium tags
      const { error: dbError } = await supabase
        .from('listings')
        .update({
          is_premium: true,
          premium_until: premiumUntilDate.toISOString(),
          status: 'active',
        })
        .eq('id', listing.id)

      if (dbError) throw dbError

      // Show instant success message to user
      setIsSuccess(true)
      setStatusMessage('Тариф продвижения активирован мгновенно! Спасибо за оплату.')

      // 2. BACKGROUND VALIDATION:
      // Send receipt PDF asynchronously to background verification route
      const formData = new FormData()
      formData.append('receipt', file)
      formData.append('listingId', listing.id)
      formData.append('tariffPrice', tariffPrice.toString())

      // Fire and forget verification, handle response in background
      fetch('/api/verify-receipt', {
        method: 'POST',
        body: formData,
      })
        .then(async (res) => {
          const verifyResult = await res.json()
          if (verifyResult.verified === false) {
            console.warn('Receipt fraud detected in background check!')
          } else {
            console.log('Receipt verified successfully in background check.')
          }
        })
        .catch((err) => {
          console.error('Error during background receipt verification:', err)
        })

    } catch (err) {
      console.error('Error during receipt activation:', err)
      setStatusMessage('Ошибка при активации. Попробуйте еще раз.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-start items-center">
      <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col pb-12 relative shadow-md border-x border-gray-200 dark:border-zinc-800 transition-colors duration-200 select-none">
        
        {/* Header */}
        <Header type="title" title="рекламировать" showBack={true} showHelpToggle={false} />

        <div className="flex-1 px-5 py-4 flex flex-col gap-6">
          <div className="flex flex-col text-center mt-2">
            <span className="text-sm font-extrabold text-brand-black dark:text-brand-white uppercase tracking-wider mb-1">
              Выберите тариф продвижения
            </span>
            <span className="text-xs text-brand-gray max-w-[300px] mx-auto leading-relaxed">
              Объявления в ТОПе выводятся в самом верху ленты и получают в 10 раз больше просмотров
            </span>
          </div>

          {/* Stec of Tariffs */}
          <div className="flex flex-col gap-3">
            
            {/* Tariff 1: 3 days */}
            <div
              onClick={() => setSelectedTariff('3_days')}
              className={`rounded-3xl p-5 border cursor-pointer transition-all duration-200 flex justify-between items-center relative overflow-hidden shadow-xs ${
                selectedTariff === '3_days'
                  ? 'scale-101 border-brand-blue ring-1 ring-brand-blue/30'
                  : 'border-gray-200 dark:border-zinc-800'
              } ${
                theme === 'light'
                  ? selectedTariff === '3_days'
                    ? 'bg-white border-brand-blue'
                    : 'bg-white text-black'
                  : selectedTariff === '3_days'
                    ? 'bg-brand-blue text-white border-transparent'
                    : 'bg-brand-card-dark text-white'
              }`}
            >
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-extrabold lowercase">3 дня в ТОПЕ</span>
                <span className={`text-[10px] font-bold ${
                  selectedTariff === '3_days' && theme === 'dark' ? 'text-blue-100' : 'text-brand-gray'
                }`}>
                  100+ просмотров в день
                </span>
              </div>
              
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs text-brand-red font-extrabold line-through decoration-[1.5px] mb-0.5">
                  390 ₸
                </span>
                <span className={`text-sm font-black py-1 px-3 rounded-full ${
                  theme === 'light'
                    ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                    : selectedTariff === '3_days'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-800 text-brand-blue'
                }`}>
                  {prices.price_3_days_top} ₸
                </span>
              </div>
            </div>

            {/* Tariff 2: 7 days */}
            <div
              onClick={() => setSelectedTariff('7_days')}
              className={`rounded-3xl p-5 border cursor-pointer transition-all duration-200 flex justify-between items-center relative overflow-hidden shadow-xs ${
                selectedTariff === '7_days'
                  ? 'scale-101 border-brand-blue ring-1 ring-brand-blue/30'
                  : 'border-gray-200 dark:border-zinc-800'
              } ${
                theme === 'light'
                  ? selectedTariff === '7_days'
                    ? 'bg-white border-brand-blue'
                    : 'bg-white text-black'
                  : selectedTariff === '7_days'
                    ? 'bg-brand-blue text-white border-transparent'
                    : 'bg-brand-card-dark text-white'
              }`}
            >
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-extrabold lowercase">7 дней в ТОПЕ</span>
                <span className={`text-[10px] font-bold ${
                  selectedTariff === '7_days' && theme === 'dark' ? 'text-blue-100' : 'text-brand-gray'
                }`}>
                  250+ просмотров в день
                </span>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs text-brand-red font-extrabold line-through decoration-[1.5px] mb-0.5">
                  690 ₸
                </span>
                <span className={`text-sm font-black py-1 px-3 rounded-full ${
                  theme === 'light'
                    ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                    : selectedTariff === '7_days'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-800 text-brand-blue'
                }`}>
                  {prices.price_7_days_top} ₸
                </span>
              </div>
            </div>

            {/* Tariff 3: 30 days */}
            <div
              onClick={() => setSelectedTariff('30_days')}
              className={`rounded-3xl p-5 border cursor-pointer transition-all duration-200 flex justify-between items-center relative overflow-hidden shadow-xs ${
                selectedTariff === '30_days'
                  ? 'scale-101 border-purple-500 ring-1 ring-purple-500/30'
                  : 'border-gray-200 dark:border-zinc-800'
              } ${
                theme === 'light'
                  ? 'bg-purple-50/50 border-purple-200 text-purple-950'
                  : 'bg-purple-950/40 text-white border-purple-900/60'
              }`}
            >
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-extrabold lowercase">30 дней в ТОПЕ</span>
                <span className={`text-[10px] font-bold ${
                  theme === 'light' ? 'text-purple-600' : 'text-purple-300/80'
                }`}>
                  Максимальный охват
                </span>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs text-brand-red font-extrabold line-through decoration-[1.5px] mb-0.5">
                  790 ₸
                </span>
                <span className={`text-sm font-black py-1 px-3 rounded-full ${
                  theme === 'light'
                    ? 'bg-purple-500 text-white shadow-xs'
                    : 'bg-purple-500/20 text-purple-200'
                }`}>
                  {prices.price_30_days_top} ₸
                </span>
              </div>
            </div>

          </div>

          {/* payment interface */}
          <div className="mt-4 flex flex-col gap-5">
            {!isSuccess ? (
              <>
                <button
                  onClick={handlePayClick}
                  className="w-full bg-brand-red text-white rounded-2xl py-4 font-bold text-center flex items-center justify-center gap-2 hover:bg-red-600 active:scale-98 transition-all duration-200 shadow-sm text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Coins className="w-3.5 h-3.5 text-brand-red fill-brand-red" />
                  </div>
                  Оплатить
                </button>

                {/* Receipt Upload uploader */}
                <div className="border border-dashed border-gray-300 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-850/30 text-center relative hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <UploadCloud className="w-8 h-8 text-brand-blue mb-2.5" />
                  <span className="text-xs font-bold text-brand-black dark:text-brand-white mb-1">
                    {file ? file.name : 'Загрузите чек Каспи (PDF)'}
                  </span>
                  <span className="text-[10px] text-brand-gray max-w-[200px]">
                    {file
                      ? `Размер: ${(file.size / 1024 / 1024).toFixed(2)} МБ`
                      : 'После оплаты скачайте квитанцию в PDF и загрузите ее сюда'}
                  </span>
                </div>

                {file && (
                  <button
                    onClick={handleUploadReceipt}
                    disabled={isUploading}
                    className="w-full bg-brand-blue text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center text-sm shadow-xs active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isUploading ? 'Проверка...' : 'Активировать рекламу'}
                  </button>
                )}

                {statusMessage && (
                  <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 py-1 leading-relaxed">
                    {statusMessage}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-3xl p-6 flex flex-col items-center text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <h4 className="text-sm font-extrabold text-green-800 dark:text-green-300 uppercase tracking-wider mb-1.5">
                  Успешная активация!
                </h4>
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold max-w-[260px] leading-relaxed mb-6">
                  Чек успешно принят. Ваше объявление мгновенно добавлено в ТОП и поднято в ленте.
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="bg-green-600 text-white rounded-full py-2.5 px-6 font-bold text-xs active:scale-95 transition-all"
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
