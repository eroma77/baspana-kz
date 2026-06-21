'use client'

import React, { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart, ChevronLeft, MapPin, Home, User, Users, Calendar, Coins, FileText, ChevronRight, Clock, ExternalLink } from 'lucide-react'

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

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
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
  const displayPhotos = listing.mode === 'apartment'
    ? (listing.photos || []).slice(0, 5)
    : (listing.photos || []).slice(0, 3)

  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 flex flex-col justify-start items-center">
      <div className="w-full max-w-md min-h-screen bg-brand-bg-light dark:bg-brand-bg-dark flex flex-col pb-12 relative shadow-md border-x border-gray-200 dark:border-zinc-800 transition-colors duration-200 select-none">
        
        {/* Header (Back button, Title "объявление") */}
        <Header type="title" title="объявление" showBack={true} showHelpToggle={false} />

        {/* --- APARTMENT MODE DESIGN --- */}
        {listing.mode === 'apartment' && (
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
              <div className="w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-850 rounded-3xl flex items-center justify-center text-brand-gray text-xs mb-6 border border-gray-200/50 dark:border-zinc-800/50">
                Нет фотографий
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-2">Описание</h3>
              <p className="text-sm text-zinc-850 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                {listing.description}
              </p>
            </div>

            {/* Parameter Matrix (10 tags / 2 columns) */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-3">Детали сожительства</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 border border-gray-200/80 dark:border-zinc-800/80 rounded-3xl p-5 bg-white dark:bg-brand-card-dark transition-colors duration-200 text-sm">
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <MapPin className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span className="truncate">{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Home className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>{listing.rooms}-комн.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <User className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span className="truncate">Пол: {listing.gender}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Calendar className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Возраст: {listing.age_from}-{listing.age_to}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Users className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span className="truncate">С кем: {listing.can_live_with || 'все'}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Users className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Нас: {listing.people_count} чел.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Clock className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Срок: {listing.term}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Users className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Общий: {listing.total_people} чел.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Coins className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Деп: {listing.deposit > 0 ? `${formatPrice(listing.deposit)} ₸` : 'нет'}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <FileText className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Договор: {listing.contract === 'yes' ? 'да' : 'нет'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- ROOMMATE MODE DESIGN --- */}
        {listing.mode === 'roommate' && (
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
            <div className="mb-6">
              <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-2">О себе и сожителе</h3>
              <p className="text-sm text-zinc-850 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                {listing.description}
              </p>
            </div>

            {/* Parameter Matrix (10 tags / 2 columns) */}
            <div className="mb-8">
              <h3 className="text-xs uppercase font-extrabold text-brand-gray tracking-wider mb-3">Параметры анкеты</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 border border-gray-200/80 dark:border-zinc-800/80 rounded-3xl p-5 bg-white dark:bg-brand-card-dark transition-colors duration-200 text-sm">
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <MapPin className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span className="truncate">{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Home className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>{listing.rooms}-комн.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Users className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Будет жить: {listing.people_count} чел.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Users className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Ищу: {listing.searching_count} чел.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Users className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Общий: {listing.total_people} чел.</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Calendar className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Возраст: {listing.age_from}-{listing.age_to}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <User className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Ищу пол: {listing.gender}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <Coins className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Деп: {listing.deposit > 0 ? `${formatPrice(listing.deposit)} ₸` : 'нет'}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <FileText className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>Договор: {listing.contract === 'yes' ? 'да' : 'нет'}</span>
                </div>
                <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
                  <ExternalLink className="w-4 h-4 mr-2.5 text-brand-blue shrink-0" />
                  <span>{listing.address_link ? '2GIS: есть' : '2GIS: нет'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

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
    </div>
  )
}
