import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin Supabase client to bypass RLS for anti-fraud corrections
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File | null
    const listingId = formData.get('listingId') as string | null
    const tariffPrice = formData.get('tariffPrice') as string | null // e.g. "190"

    if (!file || !listingId || !tariffPrice) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const priceExpected = parseInt(tariffPrice)
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
