import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRateLimiter, getClientIp } from '@/lib/rate-limiter'

// Rate limiter: max 5 receipt uploads per IP per 10 minutes
const receiptRateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 10 * 60 * 1000 })

// Admin Supabase client to bypass RLS for anti-fraud corrections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  // #C: Rate limit — 5 requests per IP per 10 minutes
  const ip = getClientIp(req)
  const rateResult = receiptRateLimiter.check(ip)
  if (!rateResult.ok) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Подождите немного и попробуйте снова.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } }
    )
  }

  // Verify caller is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File | null
    const listingId = formData.get('listingId') as string | null
    const tariffPrice = formData.get('tariffPrice') as string | null // e.g. "190"

    if (!file || !listingId || !tariffPrice) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Validate tariffPrice is a positive integer
    const priceExpected = parseInt(tariffPrice, 10)
    if (isNaN(priceExpected) || priceExpected <= 0) {
      return NextResponse.json({ error: 'Invalid tariffPrice' }, { status: 400 })
    }

    // Verify caller owns the listing — prevent tampering with other users' listings
    const { data: listing, error: ownerError } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id')
      .eq('id', listingId)
      .single()

    if (ownerError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract raw readable ASCII/UTF-8 strings from PDF file to get transaction text
    const rawText = buffer.toString('utf-8')
    
    // Parse Kaspi transaction ID (usually 10 to 12 digits preceded by № or similar)
    // Common Kaspi patterns: "№ 1234567890", "Номер транзакции: 1234567890", "Операция №1234567890"
    const txIdMatch = rawText.match(/(?:№|номер|операция|transaction|id)[:\s#]*(\d{9,13})/i)
    let transactionId = txIdMatch ? txIdMatch[1] : null

    // Fallback: If pdf-parse isn't fully readable, generate a hash of the file as transaction ID
    if (!transactionId) {
      // Find any 10-digit number sequence in raw bytes
      const genericMatch = rawText.match(/\b(\d{10,12})\b/)
      transactionId = genericMatch ? genericMatch[1] : `hash_${buffer.length}_${file.size}`
    }

    // Verify uniqueness of transaction ID in database
    const { data: duplicateListing } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id')
      .eq('transaction_id', transactionId)
      .neq('id', listingId) // Ignore current listing
      .single()

    if (duplicateListing) {
      // FRAUD DETECTED: Reuse of receipt
      await markAsFraud(listingId, 'Повторное использование чека (дубликат транзакции)')
      return NextResponse.json({ verified: false, reason: 'Duplicate transaction' })
    }

    // Parse sum. Let's look for expected price in PDF bytes
    // e.g. raw text contains "190 ₸" or "490 ₸" or "190" or "490"
    const pricePattern = new RegExp(`(${priceExpected}|${priceExpected.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\\s')})\\s*(?:₸|〒|тенге|KZT)`, 'i')
    const hasPrice = rawText.match(pricePattern) || rawText.includes(priceExpected.toString())

    if (!hasPrice) {
      // FRAUD DETECTED: Payment sum mismatch
      await markAsFraud(listingId, `Неверная сумма в чеке (ожидалось ${priceExpected} ₸)`)
      return NextResponse.json({ verified: false, reason: 'Price mismatch' })
    }

    // Save transaction ID to current listing to prevent reuse
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({ transaction_id: transactionId })
      .eq('id', listingId)

    if (updateError) throw updateError

    return NextResponse.json({ verified: true, transactionId })
  } catch (err) {
    console.error('Error during receipt verification:', err)
    const errorMsg = err instanceof Error ? err.message : 'Internal verification error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

async function markAsFraud(listingId: string, reason: string) {
  console.warn(`Receipt FRAUD detected for listing ${listingId}: ${reason}`)
  // Revoke premium and mark status as receipt_error
  await supabaseAdmin
    .from('listings')
    .update({
      status: 'receipt_error',
      is_premium: false,
      premium_until: null,
      transaction_id: null,
    })
    .eq('id', listingId)
}
