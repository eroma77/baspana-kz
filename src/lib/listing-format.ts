// Shared formatting helpers for listings.
// Single source of truth — previously duplicated (and drifting) between
// listing-card.tsx and the listing detail page.

/** "120000" -> "120 000" */
export const formatPrice = (n: number) =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/** City name -> 3-letter abbreviation shown in the location chip. */
export const getCityAbbr = (city: string) => {
  const c = city.toLowerCase().trim()
  if (c.includes('алматы')) return 'АЛА'
  if (c.includes('астана') || c.includes('нур-султан')) return 'АСТ'
  if (c.includes('шымкент')) return 'ШЫМ'
  if (c.includes('караганд')) return 'КГД'
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

/**
 * District label for display. Returns the FULL Russian district name exactly
 * as stored (e.g. "Алмалинский") so it is identical everywhere — feed cards,
 * detail page and the filter dropdown. Only the "any district" sentinels are
 * blanked out. Do NOT shorten or translate: mixing "Алмалы"/"Алмалинский"
 * caused confusion.
 */
export const formatDistrict = (d?: string | null) => {
  if (!d || d === '-' || d === 'Не важно' || d === 'all') return ''
  return d.trim()
}

/** Correct Russian plural for "год/года/лет". */
export const getAgePlural = (age: number) => {
  const d = age % 10
  const dd = age % 100
  if (dd >= 11 && dd <= 14) return 'лет'
  if (d === 1) return 'год'
  if (d >= 2 && d <= 4) return 'года'
  return 'лет'
}

// 2GIS city slugs for the cities we support, used to build a precise
// fallback search URL when a listing has no explicit address link.
const CITY_SLUG: Record<string, string> = {
  'Алматы': 'almaty', 'Астана': 'astana', 'Шымкент': 'shymkent',
  'Караганда': 'karaganda', 'Актобе': 'aktobe', 'Тараз': 'taraz',
  'Павлодар': 'pavlodar', 'Семей': 'semey', 'Кызылорда': 'kyzylorda',
  'Атырау': 'atyrau', 'Костанай': 'kostanay', 'Уральск': 'uralsk',
  'Петропавловск': 'petropavl', 'Актау': 'aktau', 'Темиртау': 'temirtau',
  'Туркестан': 'turkestan', 'Кокшетау': 'kokshetau',
  'Талдыкорган': 'taldykorgan', 'Жезказган': 'zhezkazgan',
}

/** Build a safe 2GIS URL: the listing's link if it's a real http(s) URL,
 *  otherwise a city-scoped search (avoids javascript:/data: scheme abuse). */
export const build2gisUrl = (
  addressLink: string | null | undefined,
  city: string,
  district?: string | null,
) => {
  if (addressLink && (addressLink.startsWith('https://') || addressLink.startsWith('http://'))) {
    return addressLink
  }
  const slug = CITY_SLUG[(city || '').trim()] || 'almaty'
  const q = encodeURIComponent(`${city} ${district || ''}`.trim())
  return `https://2gis.kz/${slug}/search/${q}`
}

/** Normalize a KZ phone to wa.me digits (strip non-digits, 8->7, ensure 7…). */
export const normalizePhone = (raw: string) => {
  const clean = raw.replace(/\D/g, '').replace(/^8/, '7')
  return clean.startsWith('7') ? clean : `7${clean}`
}

/** WhatsApp deep link for a phone number. */
export const whatsappUrl = (phone: string) => `https://wa.me/${normalizePhone(phone)}`

/** Normalize a gender/can-live-with value to a display label. */
export const formatCanLiveWith = (val?: string | null) => {
  if (!val) return 'Не важно'
  const v = val.toLowerCase().trim()
  if (v.includes('парн') || v.includes('муж')) return 'Только парни'
  if (v.includes('дев') || v.includes('жен')) return 'Только девочки'
  return 'Не важно'
}
