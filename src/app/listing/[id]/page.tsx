'use client'

import React, { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart, ChevronLeft, MapPin, Home, User, Users, Calendar, Coins, FileText, ChevronRight, Clock, ExternalLink } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

const formatCanLiveWith = (val?: string | null) => {
  if (!val) return 'Не важно'
  const v = val.toLowerCase().trim()
  if (v === 'парни' || v === 'мужской' || v === 'только парни' || v.includes('парн')) return 'Только парни'
  if (v === 'девушки' || v === 'девочки' || v === 'женский' || v === 'только девушки' || v === 'только девочки' || v.includes('дев')) return 'Только девочки'
  return 'Не важно'
}

const formatRoommateSearching = (val?: string | null) => {
  if (!val) return 'всех'
  const v = val.toLowerCase().trim()
  if (v === 'не важно' || v === 'все') return 'всех'
  if (v.includes('парн') || v.includes('муж')) return 'парней'
  if (v.includes('дев') || v.includes('жен')) return 'девушек'
  return 'пару'
}

const getCityAbbreviation = (city: string) => {
  const c = city.toLowerCase().trim()
  if (c.includes('алматы')) return 'АЛА'
  if (c.includes('астана')) return 'АСТ'
  if (c.includes('шымкент')) return 'ШЫМ'
  if (c.includes('караганда') || c.includes('караганды')) return 'КГД'
  if (c.includes('актобе')) return 'АКБ'
  if (c.includes('тараз')) return 'ТРЗ'
  if (c.includes('павлодар')) return 'ПВД'
  if (c.includes('семей')) return 'СМЙ'
  if (c.includes('кызылорда')) return 'КЗД'
  if (c.includes('атырау')) return 'АТУ'
  if (c.includes('костанай')) return 'КСТ'
  if (c.includes('уральск')) return 'УРЛ'
  if (c.includes('петропавловск')) return 'ПТП'
  if (c.includes('актау')) return 'АКТ'
  if (c.includes('темиртау')) return 'ТМТ'
  if (c.includes('туркестан')) return 'ТРК'
  if (c.includes('кокшетау')) return 'КШТ'
  if (c.includes('талдыкорган')) return 'ТЛД'
  if (c.includes('жезказган')) return 'ЖЗК'
  return city.substring(0, 3).toUpperCase()
}

const formatDistrict = (district?: string | null) => {
  if (!district || district === '-' || district === 'Не важно' || district === 'all') return ''
  const d = district.trim()
  
  // Mapping for Almaty districts
  if (d.includes('Алатау')) return 'Алатау'
  if (d.includes('Алмали')) return 'Алмалы'
  if (d.includes('Ауэзов')) return 'Ауэзов'
  if (d.includes('Бостандык')) return 'Бостандык'
  if (d.includes('Жетысу')) return 'Жетысу'
  if (d.includes('Медеу')) return 'Медеу'
  if (d.includes('Наурызбай')) return 'Наурызбай'
  if (d.includes('Турксиб')) return 'Турксиб'
  
  // Mapping for Shymkent districts
  if (d.includes('Абай')) return 'Абай'
  if (d.includes('Аль-Фараби')) return 'Аль-Фараби'
  if (d.includes('Енбекши')) return 'Енбекши'
  if (d.includes('Каратау')) return 'Каратау'
  if (d.includes('Туран')) return 'Туран'
  
  // Strip "ский" or "ская" suffix
  return d.replace(/ский$/, '').replace(/ская$/, '')
}

const getAgePlural = (age: number) => {
  const lastDigit = age % 10
  const lastTwoDigits = age % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет'
  if (lastDigit === 1) return 'год'
  if (lastDigit >= 2 && lastDigit <= 4) return 'года'
  return 'лет'
}

const formatAge = (from: number, to: number) => {
  if (from === to) return `${from} ${getAgePlural(from)}`
  return `${from}-${to} лет`
}

const formatTerm = (term?: string | null) => {
  if (!term) return ''
  return term.replace(/месяца|месяцев/i, 'месяц')
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ListingDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const { user, favorites, toggleFavorite, addToViewed } = useAppStore()

  // State
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setListing(data as Listing)
        
        // Add to history
        addToViewed(id)
      } catch (err) {
        console.error('Error fetching listing details:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListing()
  }, [id, addToViewed])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col justify-start items-center">
        <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-2"></div>
          <span className="text-xs text-brand-gray">Загрузка объявления...</span>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col justify-start items-center">
        <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col items-center justify-center px-6 text-center">
          <span className="text-sm font-bold text-brand-black dark:text-brand-white mb-2">Объявление не найдено</span>
          <button
            onClick={() => router.push('/')}
            className="bg-brand-blue text-white rounded-full py-2 px-5 text-xs font-bold"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  const isFav = favorites.includes(listing.id)
  const cityAbbr = getCityAbbreviation(listing.city)

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      })
    } catch {
      return dateStr
    }
  }

  const handleGuardAction = (action: () => void) => {
    if (!user) {
      router.push('/profile')
    } else {
      action()
    }
  }

  const handleWhatsApp = () => {
    handleGuardAction(() => {
      const cleanPhone = listing.phone.replace(/\D/g, '')
      const phoneUrl = cleanPhone.startsWith('7') || cleanPhone.startsWith('8')
        ? cleanPhone.replace(/^8/, '7')
        : `7${cleanPhone}`
      window.open(`https://wa.me/${phoneUrl}`, '_blank')
    })
  }

  const handle2GIS = () => {
    if (listing.address_link) {
      window.open(listing.address_link, '_blank')
    } else {
      const query = `${listing.city} ${listing.district || ''}`
      window.open(`https://2gis.kz/search/${encodeURIComponent(query)}`, '_blank')
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Limit pictures: 3 to 5 for apartments, max 3 for roommates
  const displayPhotos = listing.mode === 'roommate'
    ? (listing.photos || []).slice(0, 5)
    : (listing.photos || []).slice(0, 3)

  return (
    <div className="h-screen h-[100dvh] w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-start items-center overflow-hidden">
      <div className="w-full max-w-md h-full bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col relative shadow-md border-x border-gray-200 dark:border-zinc-800 transition-colors duration-200 select-none overflow-hidden">
        <main className="flex-1 flex flex-col w-full overflow-y-auto overflow-x-hidden pb-24">
        
        {/* Header (Back button, Title "объявление") */}
        <Header type="title" title="объявление" showBack={true} showHelpToggle={false} />

        {/* --- APARTMENT MODE DESIGN --- */}
        {listing.mode === 'roommate' && (
          <div className="flex flex-col flex-1 px-5 py-2">
            
            {/* Price & Date */}
            <div className="flex flex-col mb-4">
              <span className="text-2xl font-black text-brand-black dark:text-brand-white">
                {formatPrice(listing.price_from)}
                {listing.price_to && listing.price_to !== listing.price_from
                  ? ` - ${formatPrice(listing.price_to)}`
                  : ''}{' '}
                ₸
              </span>
              <span className="text-xs text-brand-gray mt-1">
                Опубликовано: {formatDate(listing.created_at)}
              </span>
            </div>

            {/* WhatsApp (50%) & 2GIS (50%) side by side */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleWhatsApp}
                className="flex-1 bg-brand-blue text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 text-sm shadow-xs"
              >
                Ватцап
              </button>
              <button
                onClick={handle2GIS}
                className="flex-1 bg-zinc-150 dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-zinc-250 dark:hover:bg-zinc-850 active:scale-98 transition-all duration-200 text-sm border border-gray-200/50 dark:border-zinc-700/50"
              >
                2 гис
              </button>
            </div>

            {/* Slider containing photos */}
            {displayPhotos.length > 0 ? (
              <div className="relative w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-850 rounded-3xl overflow-hidden mb-6 group border border-gray-200/50 dark:border-zinc-800/50">
                <div
                  className="w-full h-full relative cursor-pointer"
                  onClick={() => openLightbox(activeImageIndex)}
                >
                  <Image
                    src={displayPhotos[activeImageIndex]}
                    alt="Фото жилья"
                    fill
                    sizes="(max-width: 480px) 100vw, 400px"
                    className="object-cover object-center"
                  />
                </div>

                {/* Heart Button in the corner */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleGuardAction(() => toggleFavorite(listing.id))
                  }}
                  className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="В избранное"
                >
                  <Heart
                    className={`w-6 h-6 drop-shadow-md transition-colors duration-200 ${
                      isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-white fill-none'
                    }`}
                  />
                </button>

                {/* Left/Right controls (only if multiple images) */}
                {displayPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === 0 ? displayPhotos.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === displayPhotos.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {displayPhotos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        activeImageIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-850 rounded-3xl flex items-center justify-center text-brand-gray text-xs mb-6 border border-gray-200/50 dark:border-zinc-800/50 relative">
                Нет фотографий

                {/* Heart Button in the corner (when no photos) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleGuardAction(() => toggleFavorite(listing.id))
                  }}
                  className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="В избранное"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-zinc-400 dark:text-zinc-550 fill-none'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Description */}
            {listing.description && listing.description.trim() && (
              <div className="mb-6">
                <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-2">Описание</h3>
                <p className="text-sm text-zinc-850 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Parameter Matrix (8 tags / 2 columns) — matches card exactly, scaled to match photo width */}
            <div className="mb-8 w-full">
              <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-3">Детали сожительства</h3>
              <div className="flex w-full justify-between my-1.5">
                {/* Left Column (Long parameters - 56%) */}
                <div className="flex flex-col gap-1 w-[56%]">
                  {/* Badge 1: Address */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Location.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Location-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {cityAbbr}
                      {formatDistrict(listing.district) ? `, ${formatDistrict(listing.district)}` : ''}
                    </span>
                  </div>

                  {/* Badge 2: Rooms */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Room.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Room-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">{listing.rooms.includes('-комн') ? listing.rooms : `${listing.rooms}-комнатный`}</span>
                  </div>

                  {/* Badge 3: Gender / Can live with */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Toilet.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Toilet-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {formatCanLiveWith(listing.can_live_with || listing.gender)}
                    </span>
                  </div>

                  {/* Badge 4: Total People */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Batch Assign.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Batch Assign-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">Общий: {listing.total_people}</span>
                  </div>
                </div>

                {/* Right Column (Short parameters - 41%) */}
                <div className="flex flex-col gap-1 w-[41%]">
                  {/* Badge 5: Searching Count (Ищу) */}
                  <div className="flex items-center gap-1.5 pr-1.5 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Google Web Search.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Google Web Search-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">Ищу: {listing.searching_count}</span>
                  </div>

                  {/* Badge 6: Age */}
                  <div className="flex items-center gap-1.5 pr-1.5 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Birthday.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Birthday-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">{listing.age_from}-{listing.age_to} лет</span>
                  </div>

                  {/* Badge 7: Deposit */}
                  <div className="flex items-center gap-1.5 pr-1.5 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Us Dollar Circled.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Us Dollar Circled-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">{listing.deposit > 0 ? 'Есть' : 'Нет'}</span>
                  </div>

                  {/* Badge 8: Contract */}
                  <div className="flex items-center gap-1.5 pr-1.5 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Document.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Document-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">{listing.contract === 'yes' ? 'Есть' : 'Не важно'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- ROOMMATE MODE DESIGN --- */}
        {listing.mode === 'apartment' && (
          <div className="flex flex-col flex-1 px-5 py-2">
            
            {/* Horizontal Block: Avatar (Left), Price & Date (Center), Heart (Right) */}
            <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-150 dark:border-zinc-850">
              
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Avatar (Left) */}
                <div
                  onClick={() => openLightbox(0)}
                  className="relative w-16 h-16 rounded-2xl overflow-hidden cursor-pointer shrink-0 border border-gray-250/50 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-850"
                >
                  {displayPhotos.length > 0 ? (
                    <Image
                      src={displayPhotos[0]}
                      alt="Аватар соседа"
                      fill
                      sizes="64px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-blue font-bold text-base">
                      {listing.gender.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Price & Date (Center) */}
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-black text-brand-black dark:text-brand-white truncate">
                    {formatPrice(listing.price_from)}
                    {listing.price_to && listing.price_to !== listing.price_from
                      ? ` - ${formatPrice(listing.price_to)}`
                      : ''}{' '}
                    ₸
                  </span>
                  <span className="text-[10px] text-brand-gray font-medium mt-0.5 truncate">
                    {formatDate(listing.created_at)}
                  </span>
                </div>
              </div>

              {/* Heart (Right) */}
              <button
                onClick={() => handleGuardAction(() => toggleFavorite(listing.id))}
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-zinc-400 dark:text-zinc-500"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFav ? 'text-brand-red fill-brand-red' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                />
              </button>
            </div>

            {/* WhatsApp (100% width) strictly before description */}
            <button
              onClick={handleWhatsApp}
              className="w-full bg-brand-blue text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 text-sm shadow-xs mb-6"
            >
              Ватцап
            </button>

            {/* Description */}
            {listing.description && listing.description.trim() && (
              <div className="mb-6">
                <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-2">О себе и сожителе</h3>
                <p className="text-sm text-zinc-850 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Parameter Matrix (10 tags / 2 columns) */}
            <div className="mb-8 w-full">
              <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-3">Параметры анкеты</h3>
              <div className="flex w-full justify-between my-1.5 gap-[14px]">
                {/* Left Column (5 badges - 50%) */}
                <div className="flex flex-col gap-1 w-[50%]">
                  {/* Badge 1: Address */}
                  <div
                    onClick={handle2GIS}
                    className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF] cursor-pointer hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 active:scale-[0.99] transition-all"
                  >
                    <img src="/icons/Location.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Location-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {cityAbbr}
                      {formatDistrict(listing.district) ? `, ${formatDistrict(listing.district)}` : ''}
                    </span>
                  </div>

                  {/* Badge 2: Rooms */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Room.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Room-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">{listing.rooms}</span>
                  </div>

                  {/* Badge 3: Gender */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Toilet.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Toilet-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {listing.gender}
                    </span>
                  </div>

                  {/* Badge 4: Can live with */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Gender Preference.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Gender Preference-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {listing.can_live_with || 'Не важно'}
                    </span>
                  </div>

                  {/* Badge 5: Total People */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Batch Assign.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Batch Assign-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">Общий: {listing.total_people}</span>
                  </div>
                </div>

                {/* Right Column (5 badges - 50%) */}
                <div className="flex flex-col gap-1 w-[50%]">
                  {/* Badge 6: People Count (Нас) */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Google Web Search.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Google Web Search-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">Нас: {listing.people_count}</span>
                  </div>

                  {/* Badge 7: Age */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Birthday.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Birthday-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {listing.age_from} {getAgePlural(listing.age_from)}
                    </span>
                  </div>

                  {/* Badge 8: Deposit */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Us Dollar Circled.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Us Dollar Circled-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {listing.deposit > 0 ? 'Есть' : 'Нет'}
                    </span>
                  </div>

                  {/* Badge 9: Contract */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Document.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Document-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">
                      {listing.contract === 'yes' ? 'Есть' : 'Нет'}
                    </span>
                  </div>

                  {/* Badge 10: Term */}
                  <div className="flex items-center gap-2 pr-2 pl-0 w-full h-[28px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[5px] overflow-hidden text-[13px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                    <img src="/icons/Term.svg" alt="" className="w-[28px] h-[28px] shrink-0 dark:hidden" />
                    <img src="/icons/Term-1.svg" alt="" className="w-[28px] h-[28px] shrink-0 hidden dark:block" />
                    <span className="truncate leading-none">{listing.term}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      {/* --- FULLSCREEN LIGHTBOX MODAL --- */}
      {lightboxOpen && displayPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none">
          
          {/* Close & Favorites Header */}
          <div className="absolute top-5 left-0 right-0 px-5 flex justify-between items-center z-50">
            <button
              onClick={() => setLightboxOpen(false)}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Закрыть"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleGuardAction(() => toggleFavorite(listing.id))}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="В избранное"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFav ? 'text-brand-red fill-brand-red' : 'text-white'
                }`}
              />
            </button>
          </div>

          {/* Picture Viewer */}
          <div className="relative w-full max-w-md aspect-square px-2 flex items-center justify-center">
            <Image
              src={displayPhotos[lightboxIndex]}
              alt="Увеличенное фото"
              fill
              sizes="(max-width: 480px) 100vw, 450px"
              className="object-contain"
            />

            {/* Navigation arrows (if multiple) */}
            {displayPhotos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === 0 ? displayPhotos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === displayPhotos.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {displayPhotos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  lightboxIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
              ></div>
            ))}
          </div>

        </div>
      )}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
