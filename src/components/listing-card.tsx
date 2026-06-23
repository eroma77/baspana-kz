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
  if (!val) return 'Не важно'
  const v = val.toLowerCase().trim()
  if (v === 'парни' || v === 'мужской' || v === 'только парни' || v.includes('парн')) return 'Только парни'
  if (v === 'девушки' || v === 'девочки' || v === 'женский' || v === 'только девушки' || v === 'только девочки' || v.includes('дев')) return 'Только девочки'
  return 'Не важно'
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

  const cityAbbr = getCityAbbreviation(listing.city)

  // Render APARTMENT MODE Card
  if (listing.mode === 'apartment') {
    return (
      <div
        onClick={handleCardClick}
        className={`w-[338px] mx-auto ${
          isOwnerView ? 'min-h-[288px] h-auto pb-3' : 'min-h-[288px] h-auto'
        } bg-[#FFFFFF] dark:bg-[#313131] rounded-[14px] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-4 select-none relative`}
      >
        {/* Media Header */}
        <div className="relative w-[338px] h-[87px] bg-zinc-150 dark:bg-zinc-900 shrink-0">
          {listing.photos && listing.photos.length > 0 ? (
            <Image
              src={listing.photos[0]}
              alt="Жилье"
              fill
              sizes="338px"
              priority={listing.is_premium}
              className="object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
              Нет фото
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => handleGuardAction(e, () => toggleFavorite(listing.id))}
            className="absolute top-[10px] right-[10px] z-10 w-[20px] h-[20px] bg-transparent flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="В избранное"
          >
            <Heart
              className={`w-[20px] h-[20px] transition-colors duration-200 ${
                isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-white fill-none'
              }`}
            />
          </button>

          {/* В ТОПЕ Banner */}
          {listing.is_premium && (
            <div className="absolute top-0 left-0 w-[117px] h-[33px] bg-[#007BFF] text-white flex items-center justify-center font-unbounded font-bold text-[18px] z-10">
              В ТОПЕ
            </div>
          )}
        </div>

        {/* Details Area */}
        <div className="px-[16px] pt-[12px] pb-[12px] flex flex-col flex-1 min-h-0 justify-between">
          {/* Price & Date */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-[17px] font-bold text-[#000000] dark:text-white leading-none tracking-wide truncate pr-2">
              {formatPrice(listing.price_from)}
              {listing.price_to && listing.price_to !== listing.price_from
                ? ` - ${formatPrice(listing.price_to)}`
                : ''}{' '}
              ₸
            </span>
            <span className="text-[13px] text-[#9D9D9D] font-normal leading-none shrink-0">
              {formatDate(listing.created_at)}
            </span>
          </div>

          {/* 8 Parameters Grid (2-column) — matches Figma exactly */}
          <div className="flex justify-between gap-[14px] my-1.5">
            {/* Left Column (Long parameters - 168px) */}
            <div className="flex flex-col gap-[4px] w-[168px]">
              {/* Badge 1: Address */}
              <div className="flex items-center gap-1.5 pr-2 pl-0 w-[168px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Location.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Location-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">
                  {cityAbbr}
                  {formatDistrict(listing.district) ? `, ${formatDistrict(listing.district)}` : ''}
                </span>
              </div>

              {/* Badge 2: Rooms */}
              <div className="flex items-center gap-1.5 pr-2 pl-0 w-[168px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Room.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Room-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">{listing.rooms}-комнатный</span>
              </div>

              {/* Badge 3: Gender / Can live with */}
              <div className="flex items-center gap-1.5 pr-2 pl-0 w-[168px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Toilet.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Toilet-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">
                  {formatCanLiveWith(listing.can_live_with || listing.gender)}
                </span>
              </div>

              {/* Badge 4: Total People */}
              <div className="flex items-center gap-1.5 pr-2 pl-0 w-[168px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Batch Assign.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Batch Assign-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">Общий: {listing.total_people}</span>
              </div>
            </div>

            {/* Right Column (Short parameters - 124px) */}
            <div className="flex flex-col gap-[4px] w-[124px]">
              {/* Badge 5: Searching Count (Ищу) */}
              <div className="flex items-center gap-1 pr-1.5 pl-0 w-[124px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Google Web Search.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Google Web Search-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">Ищу: {listing.searching_count}</span>
              </div>

              {/* Badge 6: Age */}
              <div className="flex items-center gap-1 pr-1.5 pl-0 w-[124px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Birthday.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Birthday-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">{listing.age_from}-{listing.age_to} лет</span>
              </div>

              {/* Badge 7: Deposit */}
              <div className="flex items-center gap-1 pr-1.5 pl-0 w-[124px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Us Dollar Circled.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Us Dollar Circled-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">{listing.deposit > 0 ? 'Есть' : 'Нет'}</span>
              </div>

              {/* Badge 8: Contract */}
              <div className="flex items-center gap-1 pr-1.5 pl-0 w-[124px] h-[22px] shrink-0 min-w-0 bg-[#F4F9FF] dark:bg-[#202020] border-[0.5px] border-[#8FCCFF] dark:border-zinc-800 rounded-[4px] overflow-hidden text-[12px] font-medium font-montserrat text-[#000000] dark:text-[#FFFFFF]">
                <img src="/icons/Document.svg" alt="" className="w-[22px] h-[22px] shrink-0 dark:hidden" />
                <img src="/icons/Document-1.svg" alt="" className="w-[22px] h-[22px] shrink-0 hidden dark:block" />
                <span className="truncate leading-none">{listing.contract === 'yes' ? 'Есть' : 'Нет'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto">
            {!isOwnerView ? (
              <div className="flex gap-[14px] justify-center">
                <button
                  onClick={handleWhatsApp}
                  className="w-[168px] h-[35px] bg-[#007BFF] text-[#FFFFFF] rounded-[5px] flex items-center justify-center font-unbounded font-medium text-[16px] hover:bg-blue-600 active:scale-[0.98] transition-all duration-200"
                >
                  Ватцап
                </button>
                <button
                  onClick={handle2GIS}
                  className="w-[124px] h-[35px] bg-[#F8F8F8] dark:bg-[#202020] text-[#000000] dark:text-white rounded-[5px] flex items-center justify-center font-unbounded font-medium text-[16px] border border-[#C7C7C7] dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200"
                >
                  2 гис
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(listing.id)
                  }}
                  className="w-full h-[32px] bg-[#007BFF] text-white rounded-[5px] font-bold text-sm text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all"
                >
                  Редактировать
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPromote?.(listing.id)
                  }}
                  className="w-full h-[32px] bg-[#007BFF] text-white rounded-[5px] font-bold text-sm text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all"
                >
                  Рекламировать
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(listing.id)
                  }}
                  className="w-full h-[32px] bg-red-50 dark:bg-zinc-800 text-[#FF3662] dark:text-white border border-red-100 dark:border-zinc-700 rounded-[5px] font-bold text-sm text-center flex items-center justify-center hover:bg-red-100 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
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
      className={`w-[338px] mx-auto ${
        isOwnerView ? 'min-h-[288px] h-auto pb-3' : 'min-h-[288px] h-auto'
      } bg-[#FFFFFF] dark:bg-[#313131] rounded-[14px] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 ease-in-out cursor-pointer flex flex-col mb-4 select-none relative`}
    >
      {/* Top Profile Row: Avatar | Price+Date | Heart */}
      <div className={`p-[12px] pb-2 flex items-center gap-3 relative ${listing.is_premium ? 'pt-[36px]' : ''}`}>
        {/* В ТОПЕ Banner */}
        {listing.is_premium && (
          <div className="absolute top-0 left-0 w-[117px] h-[33px] bg-[#007BFF] text-white flex items-center justify-center font-unbounded font-bold text-[18px] z-10">
            В ТОПЕ
          </div>
        )}

        {/* Avatar square */}
        <div className="relative w-[72px] h-[72px] rounded-[14px] overflow-hidden shrink-0 bg-zinc-150 dark:bg-zinc-800 border border-gray-250/50 dark:border-zinc-850">
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
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <span className="text-[17px] font-bold text-[#000000] dark:text-white leading-none tracking-wide truncate pr-6">
            {formatPrice(listing.price_from)}
            {listing.price_to && listing.price_to !== listing.price_from
              ? ` - ${formatPrice(listing.price_to)}`
              : ''}{' '}
            ₸
          </span>
          <span className="text-[13px] text-[#9D9D9D] font-normal leading-none mt-2">
            {formatDate(listing.created_at)}
          </span>
        </div>

        {/* Heart button */}
        <button
          onClick={(e) => handleGuardAction(e, () => toggleFavorite(listing.id))}
          className="absolute top-[12px] right-[12px] z-10 w-[20px] h-[20px] bg-transparent flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          aria-label="В избранное"
        >
          <Heart
            className={`w-[20px] h-[20px] transition-colors duration-200 ${
              isFav ? 'text-[#FF3662] fill-[#FF3662]' : 'text-zinc-400 dark:text-zinc-500 fill-none'
            }`}
          />
        </button>
      </div>

      {/* Parameters Columns */}
      <div className="flex justify-between gap-[16px] my-1.5 px-[12px]">
        {/* Left Column (Long parameters - 190px) */}
        <div className="flex flex-col gap-[4px] w-[190px]">
          {/* Badge 1: Address */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-2 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 w-[190px] h-[22px] shrink-0 min-w-0">
            <MapPin className="w-[13px] h-[13px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">
              {cityAbbr}
              {listing.district && listing.district !== '-' && listing.district !== 'Не важно'
                ? `, ${listing.district}`
                : ''}
            </span>
          </div>

          {/* Badge 2: Rooms */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-2 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 w-[190px] h-[22px] shrink-0 min-w-0">
            <Home className="w-[13px] h-[13px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">{listing.rooms}-комнатный</span>
          </div>

          {/* Badge 3: Gender */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-2 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 w-[190px] h-[22px] shrink-0 min-w-0">
            <User className="w-[13px] h-[13px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">Пол: {listing.gender}</span>
          </div>

          {/* Badge 4: Term */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-2 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 w-[190px] h-[22px] shrink-0 min-w-0">
            <Clock className="w-[13px] h-[13px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">Срок: {listing.term}</span>
          </div>
        </div>

        {/* Right Column (Short parameters - 99px) */}
        <div className="flex flex-col gap-[4px] w-[99px]">
          {/* Badge 5: Searching Count (Ищу) */}
          <div className="flex items-center gap-1 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-1.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 w-[99px] h-[22px] shrink-0 min-w-0">
            <Users className="w-[11px] h-[11px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">Ищу: {listing.can_live_with === 'все' || !listing.can_live_with ? 'всех' : listing.can_live_with === 'парни' ? 'парней' : listing.can_live_with === 'девушки' ? 'девушек' : 'пару'}</span>
          </div>

          {/* Badge 6: Age */}
          <div className="flex items-center gap-1 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-1.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 w-[99px] h-[22px] shrink-0 min-w-0">
            <Calendar className="w-[11px] h-[11px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">{listing.age_from} л.</span>
          </div>

          {/* Badge 7: Deposit */}
          <div className="flex items-center gap-1 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-1.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 w-[99px] h-[22px] shrink-0 min-w-0">
            <Coins className="w-[11px] h-[11px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">Деп: {listing.deposit > 0 ? 'Да' : 'Нет'}</span>
          </div>

          {/* Badge 8: Contract */}
          <div className="flex items-center gap-1 bg-[#F7F7F7] dark:bg-[#202020] border border-gray-200 dark:border-zinc-800 rounded-[4px] px-1.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 w-[99px] h-[22px] shrink-0 min-w-0">
            <FileText className="w-[11px] h-[11px] text-[#007BFF] shrink-0" />
            <span className="truncate leading-none">Дог: {listing.contract === 'yes' ? 'Да' : 'Нет'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons — WhatsApp 100% for roommate, no 2GIS */}
      <div className="mt-auto px-[12px] pb-[12px]">
        {!isOwnerView ? (
          <button
            onClick={handleWhatsApp}
            className="w-[306px] h-[35px] bg-[#007BFF] text-[#FFFFFF] rounded-[5px] flex items-center justify-center font-unbounded font-bold text-[16px] hover:bg-blue-600 active:scale-[0.98] transition-all duration-200"
          >
            Ватцап
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(listing.id)
              }}
              className="w-full h-[32px] bg-[#007BFF] text-white rounded-[5px] font-bold text-sm text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all"
            >
              Редактировать
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPromote?.(listing.id)
              }}
              className="w-full h-[32px] bg-[#007BFF] text-white rounded-[5px] font-bold text-sm text-center flex items-center justify-center hover:bg-blue-600 active:scale-[0.98] transition-all"
            >
              Рекламировать
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(listing.id)
              }}
              className="w-full h-[32px] bg-red-50 dark:bg-zinc-800 text-[#FF3662] dark:text-white border border-red-100 dark:border-zinc-700 rounded-[5px] font-bold text-sm text-center flex items-center justify-center hover:bg-red-100 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
