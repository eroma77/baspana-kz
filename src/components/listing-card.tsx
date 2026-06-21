'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Heart, MapPin, Home, User, Users, Calendar, Coins, FileText, Share2 } from 'lucide-react'

interface ListingCardProps {
  listing: Listing
  isOwnerView?: boolean
  onEdit?: (id: string) => void
  onPromote?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ListingCard({
  listing,
  isOwnerView = false,
  onEdit,
  onPromote,
  onDelete,
}: ListingCardProps) {
  const router = useRouter()
  const { user, favorites, toggleFavorite, addToViewed } = useAppStore()

  const isFav = favorites.includes(listing.id)

  // Smart currency formatter (automatic thousands separator)
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })
    } catch {
      return dateStr
    }
  }

  // Auth Wall Guard helper
  const handleGuardAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    if (!user) {
      router.push('/profile')
    } else {
      action()
    }
  }

  const handleCardClick = () => {
    addToViewed(listing.id)
    router.push(`/listing/${listing.id}`)
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    handleGuardAction(e, () => {
      const cleanPhone = listing.phone.replace(/\D/g, '')
      // Check if it's already prefilled with 7, if not add 7
      const phoneUrl = cleanPhone.startsWith('7') || cleanPhone.startsWith('8') 
        ? cleanPhone.replace(/^8/, '7') 
        : `7${cleanPhone}`
      window.open(`https://wa.me/${phoneUrl}`, '_blank')
    })
  }

  const handle2GIS = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (listing.address_link) {
      window.open(listing.address_link, '_blank')
    } else {
      const query = `${listing.city} ${listing.district || ''}`
      window.open(`https://2gis.kz/search/${encodeURIComponent(query)}`, '_blank')
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-white dark:bg-brand-card-dark rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-4 select-none"
    >
      {/* Media Header */}
      <div className="relative w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {listing.photos && listing.photos.length > 0 ? (
          <Image
            src={listing.photos[0]}
            alt={listing.mode === 'apartment' ? 'Жилье' : 'Селфи'}
            fill
            sizes="(max-width: 480px) 100vw, 400px"
            priority={listing.is_premium}
            className="object-cover object-center hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            Нет фото
          </div>
        )}

        {/* Favorite Icon with Auth Guard */}
        <button
          onClick={(e) => handleGuardAction(e, () => toggleFavorite(listing.id))}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="В избранное"
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${
              isFav ? 'text-brand-red fill-brand-red' : 'text-white'
            }`}
          />
        </button>

        {/* Top Status Banner */}
        {listing.is_premium && (
          <div className="absolute top-4 left-0 bg-brand-blue text-white text-xs font-bold px-3 py-1.5 rounded-r-full shadow-md z-10 uppercase tracking-wider">
            В топе
          </div>
        )}
      </div>

      {/* Main Details */}
      <div className="p-5 flex flex-col flex-1">
        {/* Price & Date Row */}
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-xl font-extrabold text-brand-black dark:text-brand-white">
            {formatPrice(listing.price_from)}
            {listing.price_to && listing.price_to !== listing.price_from
              ? ` - ${formatPrice(listing.price_to)}`
              : ''}{' '}
            ₸
          </span>
          <span className="text-xs text-brand-gray font-medium">
            {formatDate(listing.created_at)}
          </span>
        </div>

        {/* Matrix of parameters (8 tags in 2 columns) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5 text-sm">
          {/* Left Column */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
              <MapPin className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span className="truncate">{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
            </div>
            <div className="flex items-center text-zinc-700 dark:text-zinc-300">
              <Home className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span>{listing.rooms}-комн.</span>
            </div>
            <div className="flex items-center text-zinc-700 dark:text-zinc-300 truncate">
              <User className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span className="truncate">Пол: {listing.gender}</span>
            </div>
            <div className="flex items-center text-zinc-700 dark:text-zinc-300">
              <Users className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span>Всего: {listing.total_people} чел.</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center text-zinc-700 dark:text-zinc-300">
              <Users className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span>Ищут: {listing.searching_count} чел.</span>
            </div>
            <div className="flex items-center text-zinc-700 dark:text-zinc-300">
              <Calendar className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span>Возраст: {listing.age_from}-{listing.age_to}</span>
            </div>
            <div className="flex items-center text-zinc-700 dark:text-zinc-300">
              <Coins className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span>Деп: {listing.deposit > 0 ? `${formatPrice(listing.deposit)} ₸` : 'нет'}</span>
            </div>
            <div className="flex items-center text-zinc-700 dark:text-zinc-300">
              <FileText className="w-4 h-4 mr-2 text-brand-blue shrink-0" />
              <span>Договор: {listing.contract === 'yes' ? 'да' : 'нет'}</span>
            </div>
          </div>
        </div>

        {/* Buttons / Actions Row */}
        <div className="mt-auto pt-2">
          {!isOwnerView ? (
            <div className="flex justify-between items-center gap-3">
              {listing.mode === 'apartment' ? (
                <>
                  <button
                    onClick={handleWhatsApp}
                    className="flex-1 bg-brand-blue text-white rounded-2xl py-3.5 px-4 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 select-none shadow-xs text-sm"
                  >
                    Ватцап
                  </button>
                  <button
                    onClick={handle2GIS}
                    className="w-[40%] bg-zinc-150 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl py-3.5 px-4 font-bold text-center flex items-center justify-center hover:bg-zinc-250 dark:hover:bg-zinc-750 active:scale-98 transition-all duration-200 select-none text-sm border border-gray-200/50 dark:border-zinc-700/50"
                  >
                    2 гис
                  </button>
                </>
              ) : (
                <button
                  onClick={handleWhatsApp}
                  className="w-full bg-brand-blue text-white rounded-2xl py-3.5 px-4 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 select-none shadow-xs text-sm"
                >
                  Ватцап
                </button>
              )}
            </div>
          ) : (
            /* Vertical stack inside Profile / My Listings */
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(listing.id)
                }}
                className="w-full bg-brand-blue text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 text-sm"
              >
                Редактировать
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPromote?.(listing.id)
                }}
                className="w-full bg-brand-blue text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 text-sm"
              >
                Рекламировать
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(listing.id)
                }}
                className="w-full bg-brand-red/10 text-brand-red dark:bg-zinc-800 dark:text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-brand-red/20 dark:hover:bg-zinc-700 active:scale-98 transition-all duration-200 text-sm"
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
