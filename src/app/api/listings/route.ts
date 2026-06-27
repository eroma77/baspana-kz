import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// description excluded — large field, only needed in detail view which has its own select('*')
const FEED_FIELDS = 'id,owner_id,mode,city,district,gender,age_from,age_to,rooms,can_live_with,people_count,searching_count,term,total_people,deposit,contract,price_from,price_to,photos,phone,address_link,is_premium,premium_until,status,transaction_id,receipt_url,created_at'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const mode = p.get('mode')
  if (mode !== 'apartment' && mode !== 'roommate') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  let query = supabase
    .from('listings')
    .select(FEED_FIELDS)
    .eq('mode', mode)
    .eq('status', 'active')
    .limit(100)

  const city = p.get('city')
  if (city) query = query.eq('city', city)

  const district = p.get('district')
  if (district) query = query.eq('district', district)

  const gender = p.get('gender')
  if (gender) {
    if (gender === 'Парень') query = query.in('gender', ['Парень', 'мужской', 'Только парни'])
    else if (gender === 'Девушка') query = query.in('gender', ['Девушка', 'женский', 'Только девочки'])
    else query = query.eq('gender', gender)
  }

  const rooms = p.get('rooms')
  if (rooms) {
    const legacyRooms = rooms.replace('-комнатный', '').replace('+-комнатный', '+')
    query = query.in('rooms', [rooms, legacyRooms])
  }

  const deposit = p.get('deposit')
  if (deposit === 'Есть') query = query.gt('deposit', 0)
  else if (deposit === 'Нет') query = query.eq('deposit', 0)

  const contract = p.get('contract')
  if (contract === 'Есть') query = query.eq('contract', 'yes')
  else if (contract === 'Нет') query = query.eq('contract', 'no')

  const canLiveWith = p.get('canLiveWith')
  if (canLiveWith) query = query.eq('can_live_with', canLiveWith)

  const term = p.get('term')
  if (term) query = query.eq('term', term)

  const priceFrom = p.get('priceFrom')
  if (priceFrom) query = query.gte('price_from', parseInt(priceFrom) || 0)

  const priceTo = p.get('priceTo')
  if (priceTo) query = query.lte('price_from', parseInt(priceTo) || 0)

  const { data, error } = await query
  if (error) {
    console.error('[api/listings]', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }

  return NextResponse.json(data ?? [], {
    headers: {
      // Browser caches for 30s, serves stale up to 90s while revalidating in background
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    },
  })
}
