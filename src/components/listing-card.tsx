'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Heart, MapPin, Home, User, Users, Calendar, Coins, FileText, Clock, ExternalLink } from 'lucide-react'

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

  // Common styles for parameter badge/tag
  const badgeClass = "flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-gray-150 dark:border-zinc-700/50 rounded-xl py-2 px-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 truncate"

  // Render APARTMENT MODE Card
  if (listing.mode === 'apartment') {
    return (
      <div
        onClick={handleCardClick}
        className="w-full bg-white dark:bg-brand-card-dark rounded-[28px] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-5 select-none"
      >
        {/* Media Header (4:3) */}
        <div className="relative w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
          {listing.photos && listing.photos.length > 0 ? (
            <Image
              src={listing.photos[0]}
              alt="Жилье"
              fill
              sizes="(max-width: 480px) 100vw, 400px"
              priority={listing.is_premium}
              className="object-cover object-center"
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
                isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-white'
              }`}
            />
          </button>

          {/* Top Status Banner */}
          {listing.is_premium && (
            <div className="absolute top-4 left-0 bg-[#007BFF] text-white text-[10px] font-black px-3.5 py-1.5 rounded-r-full shadow-md z-10 uppercase tracking-widest">
              В топе
            </div>
          )}
        </div>

        {/* Details Area */}
        <div className="p-5 flex flex-col flex-1">
          {/* Price & Date */}
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-lg font-black text-brand-black dark:text-brand-white">
              {formatPrice(listing.price_from)}
              {listing.price_to && listing.price_to !== listing.price_from
                ? ` - ${formatPrice(listing.price_to)}`
                : ''}{' '}
              ₸
            </span>
            <span className="text-[10px] text-brand-gray font-bold">
              {formatDate(listing.created_at)}
            </span>
          </div>

          {/* 10 parameters (2-column layout) */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {/* 1. City / District */}
            <div className={badgeClass} title={`${listing.city}${listing.district ? ', ' + listing.district : ''}`}>
              <MapPin className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
            </div>
            {/* 2. Rooms count */}
            <div className={badgeClass}>
              <Home className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">{listing.rooms}-комн.</span>
            </div>
            {/* 3. Gender restrictions */}
            <div className={badgeClass}>
              <User className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Пол: {listing.gender}</span>
            </div>
            {/* 4. Age limits */}
            <div className={badgeClass}>
              <Calendar className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Возраст: {listing.age_from}-{listing.age_to}</span>
            </div>
            {/* 5. Can live with */}
            <div className={badgeClass}>
              <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">С кем: {listing.can_live_with || 'все'}</span>
            </div>
            {/* 6. Current counts (нас) */}
            <div className={badgeClass}>
              <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Нас: {listing.people_count} чел.</span>
            </div>
            {/* 7. Rent term */}
            <div className={badgeClass}>
              <Clock className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Срок: {listing.term}</span>
            </div>
            {/* 8. Total capacity (общий) */}
            <div className={badgeClass}>
              <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Общий: {listing.total_people} чел.</span>
            </div>
            {/* 9. Deposit */}
            <div className={badgeClass}>
              <Coins className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Деп: {listing.deposit > 0 ? `${formatPrice(listing.deposit)} ₸` : 'нет'}</span>
            </div>
            {/* 10. Contract */}
            <div className={badgeClass}>
              <FileText className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Договор: {listing.contract === 'yes' ? 'да' : 'нет'}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-auto pt-1">
            {!isOwnerView ? (
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={handleWhatsApp}
                  className="w-[55%] bg-[#007BFF] text-white rounded-2xl py-3 px-4 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 text-xs shadow-xs"
                >
                  Ватцап
                </button>
                <button
                  onClick={handle2GIS}
                  className="w-[40%] bg-zinc-150 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl py-3 px-4 font-bold text-center flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-98 transition-all duration-200 text-xs border border-gray-200/40 dark:border-zinc-700/40"
                >
                  2 гис
                </button>
              </div>
            ) : (
              /* Vertical stack in cabinet */
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(listing.id)
                  }}
                  className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all text-xs"
                >
                  Редактировать
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPromote?.(listing.id)
                  }}
                  className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all text-xs"
                >
                  Рекламировать
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(listing.id)
                  }}
                  className="w-full bg-red-50 dark:bg-zinc-800 text-[#FF3662] dark:text-white border border-red-100 dark:border-zinc-700 rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-red-100 dark:hover:bg-zinc-700 active:scale-98 transition-all text-xs"
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

  // Render ROOMMATE MODE Card
  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-white dark:bg-brand-card-dark rounded-[28px] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-5 select-none"
    >
      {/* Top Profile Header (Avatar Left, Price/Date Center, Heart Right) */}
      <div className="p-5 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Avatar (1:1 Ratio Square) */}
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-zinc-150 dark:bg-zinc-800 border border-gray-200/55 dark:border-zinc-750">
            {listing.photos && listing.photos.length > 0 ? (
              <Image
                src={listing.photos[0]}
                alt="Селфи"
                fill
                sizes="56px"
                className="object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#007BFF]">
                {listing.gender.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {/* Price & Date */}
          <div className="flex flex-col min-w-0">
            <span className="text-base font-black text-brand-black dark:text-brand-white truncate">
              {formatPrice(listing.price_from)}
              {listing.price_to && listing.price_to !== listing.price_from
                ? ` - ${formatPrice(listing.price_to)}`
                : ''}{' '}
              ₸
            </span>
            <span className="text-[10px] text-brand-gray font-bold mt-0.5">
              {formatDate(listing.created_at)}
            </span>
          </div>
        </div>

        {/* Heart */}
        <button
          onClick={(e) => handleGuardAction(e, () => toggleFavorite(listing.id))}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-zinc-400 dark:text-zinc-500 shrink-0"
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${
              isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-zinc-400 dark:text-zinc-500'
            }`}
          />
        </button>
      </div>

      {/* Details Area */}
      <div className="px-5 pb-5 flex flex-col flex-1">
        {/* 10 parameters (2-column layout) */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {/* 1. City / District */}
          <div className={badgeClass} title={`${listing.city}${listing.district ? ', ' + listing.district : ''}`}>
            <MapPin className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
          </div>
          {/* 2. Rooms count */}
          <div className={badgeClass}>
            <Home className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">{listing.rooms}-комн.</span>
          </div>
          {/* 3. Will live count */}
          <div className={badgeClass}>
            <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Будет жить: {listing.people_count} чел.</span>
          </div>
          {/* 4. Looking for count */}
          <div className={badgeClass}>
            <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Ищу: {listing.searching_count} чел.</span>
          </div>
          {/* 5. Total capacity */}
          <div className={badgeClass}>
            <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Общий: {listing.total_people} чел.</span>
          </div>
          {/* 6. Age limits */}
          <div className={badgeClass}>
            <Calendar className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Возраст: {listing.age_from}-{listing.age_to}</span>
          </div>
          {/* 7. Seeking gender */}
          <div className={badgeClass}>
            <User className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Ищу пол: {listing.gender}</span>
          </div>
          {/* 8. Deposit */}
          <div className={badgeClass}>
            <Coins className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Деп: {listing.deposit > 0 ? `${formatPrice(listing.deposit)} ₸` : 'нет'}</span>
          </div>
          {/* 9. Contract */}
          <div className={badgeClass}>
            <FileText className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Договор: {listing.contract === 'yes' ? 'да' : 'нет'}</span>
          </div>
          {/* 10. 2GIS Address link */}
          <div className={badgeClass}>
            <ExternalLink className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">{listing.address_link ? '2GIS: есть' : '2GIS: нет'}</span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="mt-auto pt-1">
          {!isOwnerView ? (
            /* WhatsApp strictly 100% full-width, no 2GIS */
            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#007BFF] text-white rounded-2xl py-3 px-4 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all duration-200 text-xs shadow-xs"
            >
              Ватцап
            </button>
          ) : (
            /* Vertical stack in cabinet */
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(listing.id)
                }}
                className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all text-xs"
              >
                Редактировать
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPromote?.(listing.id)
                }}
                className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-98 transition-all text-xs"
              >
                Рекламировать
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(listing.id)
                }}
                className="w-full bg-red-50 dark:bg-zinc-800 text-[#FF3662] dark:text-white border border-red-100 dark:border-zinc-700 rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-red-100 dark:hover:bg-zinc-700 active:scale-98 transition-all text-xs"
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
