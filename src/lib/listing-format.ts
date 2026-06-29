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

// Short, human-friendly district names (Almaty).
const DISTRICT_SHORT: Record<string, string> = {
  'Алатауский': 'Алатау',
  'Алмалинский': 'Алмалы',
  'Ауэзовский': 'Ауэзов',
  'Бостандыкский': 'Бостандык',
  'Жетысуский': 'Жетысу',
  'Медеуский': 'Медеу',
  'Наурызбайский': 'Наурызбай',
  'Турксибский': 'Турксиб',
}

/** District -> short label ('' for the "any district" sentinels). */
export const formatDistrict = (d?: string | null) => {
  if (!d || d === '-' || d === 'Не важно' || d === 'all') return ''
  const t = d.trim()
  if (DISTRICT_SHORT[t]) return DISTRICT_SHORT[t]
  return t.replace(/ский$/, '').replace(/ская$/, '')
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

/** Normalize a gender/can-live-with value to a display label. */
export const formatCanLiveWith = (val?: string | null) => {
  if (!val) return 'Не важно'
  const v = val.toLowerCase().trim()
  if (v.includes('парн') || v.includes('муж')) return 'Только парни'
  if (v.includes('дев') || v.includes('жен')) return 'Только девочки'
  return 'Не важно'
}
