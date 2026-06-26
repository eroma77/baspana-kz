import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRateLimiter, getClientIp } from '@/lib/rate-limiter'

const ADMIN_EMAIL = 'n.erdaullet@gmail.com'

// Rate limiter: max 20 requests per IP per minute
const adminRateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60 * 1000 })

/** 
 * Creates a Supabase client that uses the user's own JWT (from Authorization header).
 * This means RLS policies will apply — the user can only do what RLS allows.
 */
function createUserClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  )
}

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns { user, error } — user is null if token is missing/invalid.
 */
async function verifyAdminUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')

  // Use admin client to verify the token server-side
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  if (user.email !== ADMIN_EMAIL) {
    return { user: null, error: 'Forbidden: admin access only' }
  }

  return { user, error: null, token }
}

/**
 * GET /api/admin/prices
 * Returns all price settings from app_settings table.
 * Requires valid admin JWT in Authorization header.
 */
export async function GET(req: NextRequest) {
  // #C: Rate limit
  const ip = getClientIp(req)
  const rateResult = adminRateLimiter.check(ip)
  if (!rateResult.ok) {
    return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 })
  }

  const { user, error, token } = await verifyAdminUser(req)

  if (!user || !token) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const client = createUserClient(token)
    const { data, error: dbError } = await client
      .from('app_settings')
      .select('*')
      .order('key')

    if (dbError) throw dbError

    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DB error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST /api/admin/prices
 * Updates price settings in app_settings table.
 * Body: { prices: Array<{ key: string; value: number }> }
 * Requires valid admin JWT in Authorization header.
 */
export async function POST(req: NextRequest) {
  // #C: Rate limit
  const ip = getClientIp(req)
  const rateResult = adminRateLimiter.check(ip)
  if (!rateResult.ok) {
    return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 })
  }

  const { user, error, token } = await verifyAdminUser(req)

  if (!user || !token) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const body = await req.json() as { prices: Array<{ key: string; value: number }> }

    if (!body.prices || !Array.isArray(body.prices)) {
      return NextResponse.json({ error: 'Invalid body: prices array required' }, { status: 400 })
    }

    const client = createUserClient(token)

    // Update each price one by one
    for (const price of body.prices) {
      if (typeof price.key !== 'string' || typeof price.value !== 'number') continue

      const { error: updateError } = await client
        .from('app_settings')
        .update({ value: price.value, updated_at: new Date().toISOString() })
        .eq('key', price.key)

      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DB update error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
