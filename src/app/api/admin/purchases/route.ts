import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'n.erdaullet@gmail.com'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user } } = await adminClient.auth.getUser(authHeader.slice(7))
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// GET /api/admin/purchases — list of promotion purchases for manual reconciliation
export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  }
  try {
    const { data, error } = await adminClient
      .from('purchases')
      .select('id, listing_id, user_email, days, price, receipt_no, receipt_url, created_at')
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    console.error('[admin/purchases]', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
