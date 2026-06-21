'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Heart, MapPin, Home, User, Users, Calendar, Coins, FileText, Clock } from 'lucide-react'

interface ListingCardProps {
  listing: Listing
  isOwnerView?: boolean
  onEdit?: (id: string) => void
  onPromote?: (id: string) => void
  onDelete?: (id: string) => void
}

const formatCanLiveWith = (val?: string | null) => {
  if (!val || val === 'все') return 'Все'
  if (val === 'парни') return 'Только парни'
  if (val === 'девушки') return 'Только девушки'
  if (val === 'семейная пара') return 'Семейная пара'
  return val
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

  // Format relative date ("сегодня", "вчера", or short date)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return 'сегодня'
      if (diffDays === 1) return 'вчера'
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
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

  // Common styles for parameter badge/tag - matches design exactly
  const badgeClass =
    'flex items-center gap-2.5 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 truncate transition-all duration-200 ease-in-out'

  // Render APARTMENT MODE Card
  if (listing.mode === 'apartment') {
    return (
      <div
        onClick={handleCardClick}
        className="w-full bg-[#FFFFFF] dark:bg-[#313131] rounded-[24px] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-4 select-none"
      >
        {/* Media Header */}
        <div className="relative w-full aspect-[16/10] bg-zinc-150 dark:bg-zinc-900">
          {listing.photos && listing.photos.length > 0 ? (
            <Image
              src={listing.photos[0]}
              alt="Жилье"
              fill
              sizes="(max-width: 480px) 100vw, 400px"
              priority={listing.is_premium}
              className="object-cover object-center rounded-t-[24px]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
              Нет фото
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => handleGuardAction(e, () => toggleFavorite(listing.id))}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="В избранное"
          >
            <Heart
              className={`w-4.5 h-4.5 transition-colors duration-200 ${
                isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-white'
              }`}
            />
          </button>

          {/* В ТОПЕ Banner */}
          {listing.is_premium && (
            <div className="absolute top-3 left-0 bg-[#007BFF] text-white text-[10px] font-black px-3.5 py-1.5 rounded-r-full shadow-md z-10 uppercase tracking-widest">
              В ТОПЕ
            </div>
          )}
        </div>

        {/* Details Area */}
        <div className="p-4 flex flex-col flex-1">
          {/* Price & Date */}
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-[17px] font-black text-[#000000] dark:text-white leading-tight tracking-wide">
              {formatPrice(listing.price_from)}
              {listing.price_to && listing.price_to !== listing.price_from
                ? ` - ${formatPrice(listing.price_to)}`
                : ''}{' '}
              ₸
            </span>
            <span className="text-[10px] text-[#9D9D9D] font-bold">
              {formatDate(listing.created_at)}
            </span>
          </div>

          {/* 8 Parameters Grid (2-column) — matches Figma exactly */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {/* 1. City / District */}
            <div className={badgeClass}>
              <MapPin className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">
                {listing.city.substring(0, 3).toUpperCase()}
                {listing.district && listing.district !== '-' && listing.district !== 'Не важно'
                  ? `, ${listing.district}`
                  : ''}
              </span>
            </div>
            {/* 2. Ищу (searching count) */}
            <div className={badgeClass}>
              <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Ищу: {listing.searching_count}</span>
            </div>
            {/* 3. Rooms */}
            <div className={badgeClass}>
              <Home className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">{listing.rooms}-комнатный</span>
            </div>
            {/* 4. Age range */}
            <div className={badgeClass}>
              <Calendar className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">
                {listing.age_from} - {listing.age_to} лет
              </span>
            </div>
            {/* 5. Can live with (gender restriction) */}
            <div className={badgeClass}>
              <User className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">
                {formatCanLiveWith(listing.can_live_with || listing.gender)}
              </span>
            </div>
            {/* 6. Deposit */}
            <div className={badgeClass}>
              <Coins className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Депозит: {listing.deposit > 0 ? 'Да' : 'Нет'}</span>
            </div>
            {/* 7. Total people */}
            <div className={badgeClass}>
              <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Общий: {listing.total_people}</span>
            </div>
            {/* 8. Contract */}
            <div className={badgeClass}>
              <FileText className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="truncate">Договор: {listing.contract === 'yes' ? 'Да' : 'Нет'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto">
            {!isOwnerView ? (
              <div className="flex gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="flex-[55] bg-[#007BFF] text-[#FFFFFF] rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 text-xs tracking-wider"
                >
                  Ватцап
                </button>
                <button
                  onClick={handle2GIS}
                  className="flex-[40] bg-[#FFFFFF] dark:bg-[#313131] text-[#000000] dark:text-white rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 text-xs border border-gray-250 dark:border-zinc-850 tracking-wider"
                >
                  2 гис
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(listing.id)
                  }}
                  className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all text-sm"
                >
                  Редактировать
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPromote?.(listing.id)
                  }}
                  className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all text-sm"
                >
                  Рекламировать
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(listing.id)
                  }}
                  className="w-full bg-red-50 dark:bg-zinc-800 text-[#FF3662] dark:text-white border border-red-100 dark:border-zinc-700 rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-red-100 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all text-sm"
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

  // ====== ROOMMATE MODE Card ======
  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-[#FFFFFF] dark:bg-[#313131] rounded-[24px] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-4 select-none"
    >
      {/* Top Profile Row: Avatar | Price+Date | Heart */}
      <div className="p-4 pb-3 flex items-center gap-3">
        {/* Avatar square */}
        <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0 bg-zinc-150 dark:bg-zinc-800 border border-gray-250/50 dark:border-zinc-800">
          {listing.photos && listing.photos.length > 0 ? (
            <Image
              src={listing.photos[0]}
              alt="Селфи"
              fill
              sizes="72px"
              className="object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#007BFF]">
              {listing.gender.substring(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Price & Date */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[16px] font-black text-[#000000] dark:text-white leading-tight tracking-wide truncate">
            {formatPrice(listing.price_from)}
            {listing.price_to && listing.price_to !== listing.price_from
              ? ` - ${formatPrice(listing.price_to)}`
              : ''}{' '}
            ₸
          </span>
          <span className="text-[10px] text-[#9D9D9D] font-bold mt-0.5">
            {formatDate(listing.created_at)}
          </span>

          {/* В ТОПЕ badge inline for roommate */}
          {listing.is_premium && (
            <span className="mt-1 self-start bg-[#007BFF] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              В ТОПЕ
            </span>
          )}
        </div>

        {/* Heart button */}
        <button
          onClick={(e) => handleGuardAction(e, () => toggleFavorite(listing.id))}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all"
          aria-label="В избранное"
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${
              isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-zinc-400 dark:text-zinc-500'
            }`}
          />
        </button>
      </div>

      {/* Parameters Grid — matches Figma exactly for roommate */}
      <div className="px-4 pb-4 flex flex-col flex-1">
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {/* 1. City/District */}
          <div className={badgeClass}>
            <MapPin className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">
              {listing.city.substring(0, 3).toUpperCase()}
              {listing.district && listing.district !== '-' && listing.district !== 'Не важно'
                ? `, ${listing.district}`
                : ''}
            </span>
          </div>
          {/* 2. Нас (will live count) */}
          <div className={badgeClass}>
            <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Нас: {listing.people_count}</span>
          </div>
          {/* 3. Rooms */}
          <div className={badgeClass}>
            <Home className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">{listing.rooms}-комнатный</span>
          </div>
          {/* 4. Age */}
          <div className={badgeClass}>
            <Calendar className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Возраст: {listing.age_from} лет</span>
          </div>
          {/* 5. Gender (Кто ищет) */}
          <div className={badgeClass}>
            <User className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Пол: {listing.gender}</span>
          </div>
          {/* 6. Deposit */}
          <div className={badgeClass}>
            <Coins className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Депозит: {listing.deposit > 0 ? 'Да' : 'Нет'}</span>
          </div>
          {/* 7. Can live with (ищет кого) */}
          <div className={badgeClass}>
            <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Ищу: {formatCanLiveWith(listing.can_live_with)}</span>
          </div>
          {/* 8. Contract */}
          <div className={badgeClass}>
            <FileText className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Договор: {listing.contract === 'yes' ? 'Да' : 'Нет'}</span>
          </div>
          {/* 9. Total people */}
          <div className={badgeClass}>
            <Users className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Общий: {listing.total_people}</span>
          </div>
          {/* 10. Term */}
          <div className={badgeClass}>
            <Clock className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
            <span className="truncate">Срок: {listing.term}</span>
          </div>
        </div>

        {/* Action Buttons — WhatsApp 100% for roommate, no 2GIS */}
        <div className="mt-auto">
          {!isOwnerView ? (
            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#007BFF] text-[#FFFFFF] rounded-2xl py-3.5 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 text-xs tracking-wider"
            >
              Ватцап
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(listing.id)
                }}
                className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all text-sm"
              >
                Редактировать
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPromote?.(listing.id)
                }}
                className="w-full bg-[#007BFF] text-white rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all text-sm"
              >
                Рекламировать
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(listing.id)
                }}
                className="w-full bg-red-50 dark:bg-zinc-800 text-[#FF3662] dark:text-white border border-red-100 dark:border-zinc-700 rounded-2xl py-3 font-bold text-center flex items-center justify-center hover:bg-red-100 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all text-sm"
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
