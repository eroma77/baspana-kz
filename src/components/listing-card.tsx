'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Mi } from '@/components/icons'

interface ListingCardProps {
  listing: Listing
  isOwnerView?: boolean
  isFirst?: boolean
  onEdit?: (id: string) => void
  onPromote?: (id: string) => void
  onDelete?: (id: string) => void
}

/* ── Helpers ─────────────────────────────────────────────────── */

const getCityAbbr = (city: string) => {
  const c = city.toLowerCase()
  if (c.includes('алматы')) return 'АЛА'
  if (c.includes('астана')) return 'АСТ'
  if (c.includes('шымкент')) return 'ШЫМ'
  if (c.includes('карагандa') || c.includes('карагандин')) return 'КГД'
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

const formatDistrict = (d?: string | null) => {
  if (!d || d === '-' || d === 'Не важно' || d === 'all') return ''
  return d
    .replace(/ский$/, '').replace(/ская$/, '')
    .replace(/Алатауский/, 'Алатау').replace(/Алмалинский/, 'Алмалы')
    .replace(/Ауэзовский/, 'Ауэзов').replace(/Бостандыкский/, 'Бостандык')
    .replace(/Жетысуский/, 'Жетысу').replace(/Медеуский/, 'Медеу')
    .replace(/Наурызбайский/, 'Наурызбай').replace(/Турксибский/, 'Турксиб')
    .trim()
}

const formatPrice = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'сегодня'
    if (diffDays === 1) return 'вчера'
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

const formatCanLiveWith = (val?: string | null) => {
  if (!val) return 'Не важно'
  const v = val.toLowerCase()
  if (v.includes('парн') || v === 'мужской') return 'Только парни'
  if (v.includes('дев') || v === 'женский') return 'Только девочки'
  return 'Не важно'
}

const getAgePlural = (age: number) => {
  const d = age % 10
  const dd = age % 100
  if (dd >= 11 && dd <= 14) return 'лет'
  if (d === 1) return 'год'
  if (d >= 2 && d <= 4) return 'года'
  return 'лет'
}

/* ── Shared styles ───────────────────────────────────────────── */

const CARD = {
  background: 'var(--surface-container-lowest)',
  border: '1px solid var(--outline-border)',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: 'var(--shadow-card)',
  marginBottom: 16,
  cursor: 'pointer',
  userSelect: 'none' as const,
}

const CHIP = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 8px',
  borderRadius: 8,
  background: 'var(--surface-container-low)',
  border: '1px solid var(--outline-border-chip)',
  overflow: 'hidden',
  minWidth: 0,
}

const CHIP_TEXT = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--on-surface-variant)',
  overflow: 'hidden',
  whiteSpace: 'nowrap' as const,
  textOverflow: 'ellipsis',
  letterSpacing: '-0.1px',
  lineHeight: 1.2,
}

const BTN_WA = {
  flex: 1,
  height: 40,
  background: 'var(--brand-blue-container)',
  color: '#FFF',
  border: '1px solid rgba(0,67,200,0.20)',
  borderRadius: 16,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.1px',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const BTN_2GIS = {
  flex: 1,
  height: 40,
  background: 'var(--brand-green-soft)',
  color: 'var(--brand-green-text)',
  border: '1px solid var(--brand-green-border)',
  borderRadius: 16,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.1px',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/* ── Sub-components ──────────────────────────────────────────── */

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={CHIP}>
      <Mi name={icon} size={16} color="var(--on-surface-variant)" style={{ flexShrink: 0 }} />
      <span style={CHIP_TEXT}>{label}</span>
    </div>
  )
}

function FavBtn({ isFav, onClick }: { isFav: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        width: 36, height: 36, borderRadius: 9999,
        background: 'var(--surface-blur-top)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--outline-border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-label="В избранное"
    >
      <Mi name="favorite" filled={isFav} size={20} color={isFav ? 'var(--brand-red)' : 'var(--on-surface)'} />
    </button>
  )
}

function TopRibbon() {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 5,
      background: 'var(--brand-blue-container)', color: '#FFF',
      fontSize: 13, fontWeight: 500, letterSpacing: '0.05em',
      padding: '6px 16px', borderRadius: 16,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.10)',
      border: '1px solid rgba(0,67,200,0.20)',
      backdropFilter: 'blur(4px)', lineHeight: 1,
    }}>
      В ТОПЕ
    </div>
  )
}

function OwnerActions({ id, onEdit, onPromote, onDelete }: {
  id: string
  onEdit?: (id: string) => void
  onPromote?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const base = {
    width: '100%', height: 40, borderRadius: 12, cursor: 'pointer',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button style={{ ...base, background: 'var(--brand-blue-container)', color: '#FFF', border: '1px solid rgba(0,67,200,0.20)' }}
        onClick={(e) => { stop(e); onEdit?.(id) }}>редактировать</button>
      <button style={{ ...base, background: 'var(--brand-blue-container)', color: '#FFF', border: '1px solid rgba(0,67,200,0.20)' }}
        onClick={(e) => { stop(e); onPromote?.(id) }}>рекламировать</button>
      <button style={{ ...base, background: 'var(--brand-red-soft)', color: 'var(--brand-red-text)', border: '1px solid transparent' }}
        onClick={(e) => { stop(e); onDelete?.(id) }}>удалить</button>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */

export function ListingCard({
  listing,
  isOwnerView = false,
  isFirst = false,
  onEdit,
  onPromote,
  onDelete,
}: ListingCardProps) {
  const router = useRouter()
  const { user, favorites, toggleFavorite, addToViewed } = useAppStore()

  const isFav = favorites.includes(listing.id)
  const cityAbbr = getCityAbbr(listing.city)
  const district = formatDistrict(listing.district)
  const locationLabel = district ? `${cityAbbr}, ${district}` : cityAbbr

  const priceLabel = `${formatPrice(listing.price_from)}${
    listing.price_to && listing.price_to !== listing.price_from
      ? ` - ${formatPrice(listing.price_to)}`
      : ''
  } ₸`

  const handleCardClick = () => {
    addToViewed(listing.id)
    router.push(`/listing/${listing.id}`)
  }

  const handleGuard = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    if (!user) router.push('/profile')
    else action()
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    handleGuard(e, () => {
      const clean = listing.phone.replace(/\D/g, '').replace(/^8/, '7')
      const phone = clean.startsWith('7') ? clean : `7${clean}`
      window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer')
    })
  }

  const handle2GIS = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = listing.address_link
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.open(
        `https://2gis.kz/search/${encodeURIComponent(`${listing.city} ${listing.district || ''}`)}`,
        '_blank',
        'noopener,noreferrer'
      )
    }
  }

  /* ── Roommate card (apartment listing in DB) ── */
  if (listing.mode === 'roommate') {
    const chips = [
      { icon: 'location_on',   label: locationLabel },
      { icon: 'home',          label: listing.rooms.includes('-комн') ? listing.rooms : `${listing.rooms}-комн.` },
      { icon: 'wc',            label: formatCanLiveWith(listing.gender) },
      { icon: 'groups',        label: `Общий: ${listing.total_people}` },
      { icon: 'manage_search', label: `Ищу: ${listing.searching_count}` },
      { icon: 'cake',          label: `${listing.age_from}-${listing.age_to} лет` },
      { icon: 'attach_money',  label: listing.deposit > 0 ? 'Есть' : 'Нет' },
      { icon: 'description',   label: listing.contract === 'yes' ? 'Есть' : 'Нет' },
    ]

    return (
      <article
        style={CARD}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick() } }}
        role="button"
        tabIndex={0}
        aria-label={`Объявление: ${priceLabel}, ${locationLabel}`}
      >
        <div style={{ position: 'relative', width: '100%', height: 140, background: 'var(--surface-container-low)' }}>
          {listing.photos?.length ? (
            <Image
              src={listing.photos[0]} alt="Жилье" fill sizes="390px"
              priority={isFirst || listing.is_premium}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mi name="home" size={48} color="var(--outline)" />
            </div>
          )}
          {listing.is_premium && <TopRibbon />}
          <FavBtn isFav={isFav} onClick={(e) => handleGuard(e, () => toggleFavorite(listing.id))} />
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--on-surface)' }}>
              {priceLabel}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--outline)', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginLeft: 8 }}>
              {formatDate(listing.created_at)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px', marginBottom: 14 }}>
            {chips.map((c, i) => <Chip key={i} icon={c.icon} label={c.label} />)}
          </div>

          {!isOwnerView ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={BTN_WA} onClick={handleWhatsApp}>Ватцап</button>
              <button style={BTN_2GIS} onClick={handle2GIS}>2 гис</button>
            </div>
          ) : (
            <OwnerActions id={listing.id} onEdit={onEdit} onPromote={onPromote} onDelete={onDelete} />
          )}
        </div>
      </article>
    )
  }

  /* ── Apartment card (roommate listing in DB) ── */
  const chips = [
    { icon: 'location_on',  label: locationLabel },
    { icon: 'home',         label: listing.rooms },
    { icon: 'wc',           label: listing.gender },
    { icon: 'group',        label: listing.can_live_with || 'Не важно' },
    { icon: 'groups',       label: `Общий: ${listing.total_people}` },
    { icon: 'group',        label: `Нас: ${listing.people_count}` },
    { icon: 'cake',         label: `${listing.age_from} ${getAgePlural(listing.age_from)}` },
    { icon: 'attach_money', label: listing.deposit > 0 ? 'Есть' : 'Нет' },
    { icon: 'description',  label: listing.contract === 'yes' ? 'Есть' : 'Нет' },
    ...(listing.term ? [{ icon: 'schedule', label: listing.term }] : []),
  ]

  return (
    <article
      style={CARD}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick() } }}
      role="button"
      tabIndex={0}
      aria-label={`Объявление: ${priceLabel}, ${locationLabel}`}
    >
      <div style={{ padding: 12, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {/* Square avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: 16, overflow: 'hidden',
          flexShrink: 0, background: 'var(--surface-container-low)',
          border: '1px solid var(--outline-border)', position: 'relative',
        }}>
          {listing.photos?.length ? (
            <Image
              src={listing.photos[0]} alt="Фото" fill sizes="72px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mi name="person" size={30} color="var(--outline)" />
            </div>
          )}
        </div>

        {/* Price + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 44 }}>
            {priceLabel}
          </div>
          <div style={{ fontSize: 12, color: 'var(--outline)', marginTop: 4, letterSpacing: '0.05em' }}>
            {formatDate(listing.created_at)}
          </div>
          {listing.is_premium && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', marginTop: 6,
              background: 'var(--brand-blue-container)', color: '#FFF',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.05em',
              padding: '3px 10px', borderRadius: 12,
            }}>В ТОПЕ</div>
          )}
        </div>

        {/* Heart */}
        <button
          onClick={(e) => handleGuard(e, () => toggleFavorite(listing.id))}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 36, height: 36, borderRadius: 9999,
            background: 'var(--surface-container-low)',
            border: '1px solid var(--outline-border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="В избранное"
        >
          <Mi name="favorite" filled={isFav} size={18} color={isFav ? 'var(--brand-red)' : 'var(--outline)'} />
        </button>
      </div>

      <div style={{ padding: '4px 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
        {chips.map((c, i) => <Chip key={i} icon={c.icon} label={c.label} />)}
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        {!isOwnerView ? (
          <button style={{ ...BTN_WA, width: '100%', flex: 'none' }} onClick={handleWhatsApp}>Ватцап</button>
        ) : (
          <OwnerActions id={listing.id} onEdit={onEdit} onPromote={onPromote} onDelete={onDelete} />
        )}
      </div>
    </article>
  )
}
