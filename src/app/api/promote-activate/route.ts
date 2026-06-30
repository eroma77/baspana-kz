import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Manual-verification promotion flow: the receipt is NOT auto-checked here.
// Premium is activated on upload and the purchase is logged to `purchases`
// so the admin can reconcile against real Kaspi deposits.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase env vars')
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const file = form.get('receipt') as File | null
    const listingId = form.get('listingId') as string | null
    const days = parseInt((form.get('days') as string | null) || '0', 10)

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }
    if (![3, 7, 30].includes(days)) {
      return NextResponse.json({ error: 'Invalid tariff' }, { status: 400 })
    }
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Загрузите чек в формате PDF' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл превышает 10 МБ' }, { status: 400 })
    }

    // Ownership check
    const { data: listing, error: ownerErr } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id')
      .eq('id', listingId)
      .single()
    if (ownerErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Authoritative price from the requested tariff
    const tariffKey = days === 30 ? 'price_30_days_top' : days === 7 ? 'price_7_days_top' : 'price_3_days_top'
    const { data: priceSetting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', tariffKey)
      .single()
    const price = priceSetting?.value ? Math.round(parseFloat(priceSetting.value)) : 0

    // Receipt number from the Kaspi filename (e.g. receipt_QR16270857270.pdf)
    const receiptNo = (file.name || '').match(/QR\d{9,13}/i)?.[0] || null

    // Store the PDF so the admin can open it later
    let receiptUrl: string | null = null
    try {
      const path = `receipts/${listingId}-${Date.now()}.pdf`
      const buf = Buffer.from(await file.arrayBuffer())
      const { error: upErr } = await supabaseAdmin.storage
        .from('listing-photos')
        .upload(path, buf, { contentType: 'application/pdf', upsert: false })
      if (!upErr) {
        receiptUrl = supabaseAdmin.storage.from('listing-photos').getPublicUrl(path).data.publicUrl
      }
    } catch { /* non-fatal: keep going even if the upload fails */ }

    // Activate premium
    const premiumUntil = new Date(Date.now() + days * 86_400_000).toISOString()
    await supabaseAdmin
      .from('listings')
      .update({
        is_premium: true,
        premium_until: premiumUntil,
        status: 'active',
        transaction_id: receiptNo,
        receipt_url: receiptUrl,
      })
      .eq('id', listingId)

    // Log the purchase for manual reconciliation (non-fatal: activation must
    // succeed even if the purchases table is missing or insert fails).
    const { error: purchaseErr } = await supabaseAdmin.from('purchases').insert({
      listing_id: listingId,
      user_email: user.email,
      days,
      price,
      receipt_no: receiptNo,
      receipt_url: receiptUrl,
    })
    if (purchaseErr) console.error('[promote-activate] purchase log failed:', purchaseErr.message)

    return NextResponse.json({ verified: true, days, price })
  } catch (err) {
    console.error('[promote-activate]', err)
    return NextResponse.json({ error: 'Внутренняя ошибка. Попробуйте ещё раз.' }, { status: 500 })
  }
}
