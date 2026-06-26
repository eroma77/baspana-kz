'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore, Listing } from '@/store/useAppStore'
import { Header } from '@/components/header'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mi } from '@/components/icons'
import { BottomNav } from '@/components/bottom-nav'

/* ── Helpers ─────────────────────────────────────────────────────── */

const formatCanLiveWith = (val?: string | null) => {
  if (!val) return 'Не важно'
  const v = val.toLowerCase().trim()
  if (v.includes('парн') || v.includes('муж')) return 'Только парни'
  if (v.includes('дев') || v.includes('жен')) return 'Только девочки'
  return 'Не важно'
}

const getCityAbbr = (city: string) => {
  const c = city.toLowerCase().trim()
  if (c.includes('алматы'))     return 'АЛА'
  if (c.includes('астана'))     return 'АСТ'
  if (c.includes('шымкент'))    return 'ШЫМ'
  if (c.includes('карагандa') || c.includes('караганды')) return 'КГД'
  if (c.includes('актобе'))     return 'АКБ'
  if (c.includes('тараз'))      return 'ТРЗ'
  if (c.includes('павлодар'))   return 'ПВД'
  if (c.includes('семей'))      return 'СМЙ'
  if (c.includes('кызылорда')) return 'КЗД'
  if (c.includes('атырау'))     return 'АТУ'
  if (c.includes('костанай'))   return 'КСТ'
  if (c.includes('уральск'))    return 'УРЛ'
  if (c.includes('петропавловск')) return 'ПТП'
  if (c.includes('актау'))      return 'АКТ'
  if (c.includes('темиртау'))   return 'ТМТ'
  if (c.includes('туркестан'))  return 'ТРК'
  if (c.includes('кокшетау'))   return 'КШТ'
  if (c.includes('талдыкорган')) return 'ТЛД'
  if (c.includes('жезказган'))  return 'ЖЗК'
  return city.substring(0, 3).toUpperCase()
}

const formatDistrict = (d?: string | null) => {
  if (!d || d === '-' || d === 'Не важно' || d === 'all') return ''
  return d.trim().replace(/ский$/, '').replace(/ская$/, '')
}

const getAgePlural = (age: number) => {
  const l = age % 10, l2 = age % 100
  if (l2 >= 11 && l2 <= 14) return 'лет'
  if (l === 1) return 'год'
  if (l >= 2 && l <= 4) return 'года'
  return 'лет'
}

const formatPrice = (price: number) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  } catch { return dateStr }
}

/* ── Chip component ──────────────────────────────────────────────── */

function Chip({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, borderRadius: 8, padding: '0 10px 0 8px',
        background: 'var(--surface-container-low)',
        border: '1px solid var(--outline-border-chip)',
        fontSize: 12, fontWeight: 500, color: 'var(--on-surface)',
        overflow: 'hidden', minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Mi name={icon} size={15} color="var(--on-surface-variant)" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ListingDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { user, favorites, toggleFavorite, addToViewed } = useAppStore()

  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from('listings').select('*').eq('id', id).single()
        if (error) throw error
        setListing(data as Listing)
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
      <div style={{ height: '100dvh', width: '100%', background: 'var(--surface-container-highest)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 390, height: '100%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-blue-container)' }} />
          <span style={{ fontSize: 13, color: 'var(--outline)' }}>Загрузка объявления…</span>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div style={{ height: '100dvh', width: '100%', background: 'var(--surface-container-highest)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 390, height: '100%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mi name="search_off" size={32} color="var(--outline)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>Объявление не найдено</div>
          <button
            onClick={() => router.push('/')}
            style={{ height: 40, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 12, padding: '0 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  const isFav = favorites.includes(listing.id)
  const cityAbbr = getCityAbbr(listing.city)
  const district = formatDistrict(listing.district)
  const locationLabel = district ? `${cityAbbr}, ${district}` : cityAbbr

  const displayPhotos = listing.mode === 'roommate'
    ? (listing.photos || []).slice(0, 5)
    : (listing.photos || []).slice(0, 3)

  const handleGuardAction = (action: () => void) => {
    if (!user) router.push('/profile')
    else action()
  }

  const handleWhatsApp = () => {
    handleGuardAction(() => {
      const cleanPhone = listing.phone.replace(/\D/g, '')
      const phone = cleanPhone.startsWith('7') || cleanPhone.startsWith('8')
        ? cleanPhone.replace(/^8/, '7') : `7${cleanPhone}`
      window.open(`https://wa.me/${phone}`, '_blank')
    })
  }

  const handle2GIS = () => {
    if (listing.address_link) {
      window.open(listing.address_link, '_blank')
    } else {
      window.open(`https://2gis.kz/search/${encodeURIComponent(`${listing.city} ${listing.district || ''}`)}`, '_blank')
    }
  }

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true) }

  /* shared styles */
  const BTN_PRIMARY = { height: 44, background: 'var(--brand-blue-container)', color: '#FFF', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px' }
  const BTN_SECONDARY = { height: 44, background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '1px solid var(--outline-border)', borderRadius: 16, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px' }
  const FAV_BTN = { width: 40, height: 40, borderRadius: 9999, background: 'var(--surface-blur-top)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }

  return (
    <div style={{ height: '100dvh', width: '100%', background: 'var(--surface-container-highest)', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 390, height: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--outline-border)', borderRight: '1px solid var(--outline-border)', boxShadow: '0 0 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', userSelect: 'none' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: 96 }}>

          <Header type="title" title="объявление" showBack showHelpToggle={false} />

          {/* ── ROOMMATE card ─────────────────────────────────────── */}
          {listing.mode === 'roommate' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 20px' }}>

              {/* Price + date */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.5px' }}>
                  {formatPrice(listing.price_from)}
                  {listing.price_to && listing.price_to !== listing.price_from ? ` – ${formatPrice(listing.price_to)}` : ''} ₸
                </div>
                <div style={{ fontSize: 12, color: 'var(--outline)', marginTop: 4 }}>
                  Опубликовано: {formatDate(listing.created_at)}
                </div>
              </div>

              {/* WA + 2GIS */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button onClick={handleWhatsApp} style={{ ...BTN_PRIMARY, flex: 1 }}>Ватцап</button>
                <button onClick={handle2GIS} style={{ ...BTN_SECONDARY, flex: 1 }}>2ГИС</button>
              </div>

              {/* Photo slider */}
              {displayPhotos.length > 0 ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 20, overflow: 'hidden', marginBottom: 20, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)' }}>
                  <div onClick={() => openLightbox(activeImageIndex)} style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}>
                    <Image src={displayPhotos[activeImageIndex]} alt="Фото" fill sizes="(max-width:480px) 100vw,400px" className="object-cover object-center" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleGuardAction(() => toggleFavorite(listing.id)) }} style={{ ...FAV_BTN, position: 'absolute', top: 12, right: 12 }} aria-label="Избранное">
                    <Mi name="favorite" filled={isFav} size={20} color={isFav ? 'var(--brand-red)' : 'var(--on-surface-variant)'} />
                  </button>
                  {displayPhotos.length > 1 && (
                    <>
                      <button onClick={() => setActiveImageIndex(p => p === 0 ? displayPhotos.length - 1 : p - 1)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 9999, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(4px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Mi name="chevron_left" size={22} color="#FFF" />
                      </button>
                      <button onClick={() => setActiveImageIndex(p => p === displayPhotos.length - 1 ? 0 : p + 1)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 9999, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(4px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Mi name="chevron_right" size={22} color="#FFF" />
                      </button>
                    </>
                  )}
                  <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                    {displayPhotos.map((_, idx) => (
                      <div key={idx} style={{ height: 6, width: activeImageIndex === idx ? 16 : 6, borderRadius: 9999, background: activeImageIndex === idx ? '#FFF' : 'rgba(255,255,255,0.40)', transition: 'all 200ms' }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 20, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 13, color: 'var(--outline)' }}>
                  Нет фотографий
                  <button onClick={(e) => { e.stopPropagation(); handleGuardAction(() => toggleFavorite(listing.id)) }} style={{ ...FAV_BTN, position: 'absolute', top: 12, right: 12 }} aria-label="Избранное">
                    <Mi name="favorite" filled={isFav} size={20} color={isFav ? 'var(--brand-red)' : 'var(--on-surface-variant)'} />
                  </button>
                </div>
              )}

              {/* Description */}
              {listing.description?.trim() && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--outline)', marginBottom: 8 }}>Описание</div>
                  <p style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
                </div>
              )}

              {/* Chips 2-col */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--outline)', marginBottom: 10 }}>Детали сожительства</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Chip icon="location_on"   label={locationLabel} />
                  <Chip icon="manage_search" label={`Ищу: ${listing.searching_count}`} />
                  <Chip icon="home"          label={listing.rooms.includes('-комн') ? listing.rooms : `${listing.rooms}-комнатный`} />
                  <Chip icon="cake"          label={`${listing.age_from}-${listing.age_to} лет`} />
                  <Chip icon="wc"            label={formatCanLiveWith(listing.can_live_with || listing.gender)} />
                  <Chip icon="attach_money"  label={listing.deposit > 0 ? 'Залог: есть' : 'Залог: нет'} />
                  <Chip icon="groups"        label={`Всего: ${listing.total_people}`} />
                  <Chip icon="description"   label={listing.contract === 'yes' ? 'Договор: есть' : 'Договор: нет'} />
                </div>
              </div>

            </div>
          )}

          {/* ── APARTMENT card ────────────────────────────────────── */}
          {listing.mode === 'apartment' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 20px' }}>

              {/* Avatar + price + fav row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--outline-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div onClick={() => displayPhotos.length > 0 && openLightbox(0)} style={{ position: 'relative', width: 64, height: 64, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-container-low)', border: '1px solid var(--outline-border)', cursor: displayPhotos.length > 0 ? 'pointer' : 'default' }}>
                    {displayPhotos.length > 0 ? (
                      <Image src={displayPhotos[0]} alt="Аватар" fill sizes="64px" className="object-cover object-center" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mi name="person" size={28} color="var(--outline)" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatPrice(listing.price_from)}
                      {listing.price_to && listing.price_to !== listing.price_from ? ` – ${formatPrice(listing.price_to)}` : ''} ₸
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--outline)', marginTop: 3 }}>{formatDate(listing.created_at)}</div>
                  </div>
                </div>
                <button onClick={() => handleGuardAction(() => toggleFavorite(listing.id))} style={FAV_BTN} aria-label="Избранное">
                  <Mi name="favorite" filled={isFav} size={20} color={isFav ? 'var(--brand-red)' : 'var(--on-surface-variant)'} />
                </button>
              </div>

              {/* WhatsApp */}
              <button onClick={handleWhatsApp} style={{ ...BTN_PRIMARY, width: '100%', marginBottom: 20 }}>Ватцап</button>

              {/* Description */}
              {listing.description?.trim() && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--outline)', marginBottom: 8 }}>О себе и сожителе</div>
                  <p style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
                </div>
              )}

              {/* Chips 2-col */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--outline)', marginBottom: 10 }}>Параметры анкеты</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Chip icon="location_on"   label={locationLabel} onClick={handle2GIS} />
                  <Chip icon="manage_search" label={`Нас: ${listing.people_count}`} />
                  <Chip icon="home"          label={listing.rooms} />
                  <Chip icon="cake"          label={`${listing.age_from} ${getAgePlural(listing.age_from)}`} />
                  <Chip icon="wc"            label={listing.gender} />
                  <Chip icon="attach_money"  label={listing.deposit > 0 ? 'Залог: есть' : 'Залог: нет'} />
                  <Chip icon="group"         label={listing.can_live_with || 'Не важно'} />
                  <Chip icon="description"   label={listing.contract === 'yes' ? 'Договор: есть' : 'Нет'} />
                  <Chip icon="groups"        label={`Всего: ${listing.total_people}`} />
                  {listing.term && <Chip icon="schedule" label={listing.term} />}
                </div>
              </div>

            </div>
          )}

        </main>
        <BottomNav />
      </div>

      {/* Lightbox */}
      {lightboxOpen && displayPhotos.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(12px)', userSelect: 'none' }}>
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 60 }}>
            <button onClick={() => setLightboxOpen(false)} style={{ width: 44, height: 44, borderRadius: 9999, background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Mi name="arrow_back" size={22} color="#FFF" />
            </button>
            <button onClick={() => handleGuardAction(() => toggleFavorite(listing.id))} style={{ width: 44, height: 44, borderRadius: 9999, background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Mi name="favorite" filled={isFav} size={22} color={isFav ? 'var(--brand-red)' : '#FFF'} />
            </button>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 450, aspectRatio: '1', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
            <Image src={displayPhotos[lightboxIndex]} alt="Увеличенное фото" fill sizes="(max-width:480px) 100vw,450px" className="object-contain" />
            {displayPhotos.length > 1 && (
              <>
                <button onClick={() => setLightboxIndex(p => p === 0 ? displayPhotos.length - 1 : p - 1)} style={{ position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 9999, background: 'rgba(0,0,0,0.50)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Mi name="chevron_left" size={24} color="#FFF" />
                </button>
                <button onClick={() => setLightboxIndex(p => p === displayPhotos.length - 1 ? 0 : p + 1)} style={{ position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 9999, background: 'rgba(0,0,0,0.50)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Mi name="chevron_right" size={24} color="#FFF" />
                </button>
              </>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {displayPhotos.map((_, idx) => (
              <div key={idx} style={{ height: 6, width: lightboxIndex === idx ? 16 : 6, borderRadius: 9999, background: lightboxIndex === idx ? '#FFF' : 'rgba(255,255,255,0.40)', transition: 'all 200ms' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
