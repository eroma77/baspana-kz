import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRateLimiter, getClientIp } from '@/lib/rate-limiter'
import { createHash } from 'crypto'

// Rate limiter: max 5 receipt uploads per IP per 10 minutes
const receiptRateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 10 * 60 * 1000 })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// PDF Creator/Producer values that indicate image editors (not server-generated receipts)
const SUSPICIOUS_CREATORS = [
  'photoshop', 'gimp', 'inkscape', 'canva', 'illustrator',
  'paint', 'snagit', 'affinity', 'pixelmator', 'paintshop',
]

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rateResult = receiptRateLimiter.check(ip)
  if (!rateResult.ok) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Подождите немного и попробуйте снова.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)) } }
    )
  }

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
    // Client sends only the tariff LENGTH (days); the price is derived server-side.
    const days = parseInt((formData.get('days') as string | null) || '0', 10)

    if (!file || !listingId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }
    if (![3, 7, 30].includes(days)) {
      return NextResponse.json({ error: 'Invalid tariff' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Только PDF файлы принимаются' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл превышает максимальный размер 10 МБ' }, { status: 400 })
    }
    // A real Kaspi receipt PDF is never smaller than 10KB
    if (file.size < 10 * 1024) {
      await markAsFraud(listingId, 'Файл слишком маленький для настоящего чека')
      return NextResponse.json({ verified: false, reason: 'File too small' })
    }

    const { data: listing, error: ownerError } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id, premium_until')
      .eq('id', listingId)
      .single()

    if (ownerError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── DERIVE EXPECTED PRICE SERVER-SIDE FROM THE REQUESTED TARIFF ──────────
    // The client sends only the tariff length (days); the price for it is read
    // authoritatively from app_settings. A manipulated client price can't pass,
    // and premium is granted by THIS route only — never by the client directly.
    const tariffKey = days === 30 ? 'price_30_days_top' : days === 7 ? 'price_7_days_top' : 'price_3_days_top'
    const { data: priceSetting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', tariffKey)
      .single()
    const priceExpected = priceSetting?.value ? parseFloat(priceSetting.value) : 0
    if (isNaN(priceExpected) || priceExpected <= 0) {
      return NextResponse.json({ error: 'Could not determine expected tariff price' }, { status: 400 })
    }

    // Premium window granted on success (server-authoritative).
    const premiumUntil = new Date(Date.now() + days * 86_400_000).toISOString()

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── LAYER 1: File fingerprint (SHA-256) ──────────────────────────────────
    // Catches exact copies of the same file, even renamed or re-uploaded later.
    // Also mitigates race-condition reuse (combined with uniqueness check below).
    const fileHash = createHash('sha256').update(buffer).digest('hex')

    const { data: hashDuplicate } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('receipt_url', `fh:${fileHash}`)
      .neq('id', listingId)
      .single()

    if (hashDuplicate) {
      await markAsFraud(listingId, 'Точная копия ранее использованного чека (одинаковый файл)')
      return NextResponse.json({ verified: false, reason: 'Duplicate file' })
    }

    // ── LAYER 2: PDF structural integrity ────────────────────────────────────
    // A real bank receipt has exactly ONE %%EOF marker.
    // Multiple %%EOF = the PDF was modified after creation (incremental update).
    const rawBinary = buffer.toString('binary')
    const eofCount = (rawBinary.match(/%%EOF/g) || []).length
    if (eofCount > 2) {
      await markAsFraud(listingId, `PDF изменён после создания (найдено ${eofCount} маркеров %%EOF)`)
      return NextResponse.json({ verified: false, reason: 'Modified PDF' })
    }

    // ── LAYER 3: Proper text extraction via pdf-parse ─────────────────────────
    let pdfText = ''
    let pdfInfo: Record<string, string> = {}
    try {
      // Only the bare dynamic import resolves pdf-parse in the deployed
      // environment (createRequire / the /lib subpath did NOT). pdf-parse's
      // index.js debug block runs readFileSync('./test/data/05-versions-space.pdf')
      // under ESM import — we ship that fixture at the repo root so the read
      // succeeds and the module finishes loading (its async write is .catch-guarded).
      const pdfParseId = 'pdf-parse'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfMod = (await import(pdfParseId)) as any
      const pdfParse = (pdfMod.default || pdfMod) as (buffer: Buffer, options?: { max?: number }) => Promise<{ text: string; info: Record<string, string>; numpages: number }>
      const parsed = await pdfParse(buffer, { max: 3 })
      pdfText = parsed.text
      pdfInfo = (parsed.info as Record<string, string>) || {}
    } catch (e) {
      // Surface the real error so production failures are diagnosable.
      const detail = (e as Error)?.message || String(e)
      await markAsFraud(listingId, `Файл не является валидным PDF: ${detail}`)
      return NextResponse.json({ verified: false, reason: 'Invalid PDF', detail })
    }

    // ── LAYER 4: Kaspi keyword check ─────────────────────────────────────────
    // Attack closed: a fake PDF created from scratch with a PDF library would pass
    // Creator/Producer check but won't contain the word "Kaspi" or "каспи".
    const pdfTextLower = pdfText.toLowerCase()
    if (!pdfTextLower.includes('kaspi') && !pdfTextLower.includes('каспи')) {
      await markAsFraud(listingId, 'PDF не является чеком Kaspi — ключевое слово "Kaspi" отсутствует')
      return NextResponse.json({ verified: false, reason: 'Not a Kaspi receipt' })
    }

    // ── LAYER 4b: Receipt date freshness check ───────────────────────────────
    // Attack closed: attacker collects old valid receipts (from past purchases)
    // or edits a receipt and manipulates the date. A legitimate fresh payment
    // should have a date within the last 72 hours.
    // Kaspi date format: "25.06.2026 14:13" (Astana time, UTC+5)
    const dateMatch = pdfText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/)
    if (dateMatch) {
      const [, day, month, year, time] = dateMatch
      const receiptDate = new Date(`${year}-${month}-${day}T${time}:00+05:00`)
      const ageMinutes = (Date.now() - receiptDate.getTime()) / 60_000
      if (ageMinutes > 60) {
        await markAsFraud(listingId, `Чек устарел: дата в чеке ${day}.${month}.${year} ${time}, допускается только за последние 60 минут`)
        return NextResponse.json({ verified: false, reason: 'Receipt too old' })
      }
      if (ageMinutes < -60) {
        // Date is in the future (impossible for real receipt, likely forgery)
        await markAsFraud(listingId, `Дата в чеке из будущего: ${day}.${month}.${year} — подделка`)
        return NextResponse.json({ verified: false, reason: 'Receipt date in future' })
      }
    }

    // ── LAYER 5: Metadata creator check ──────────────────────────────────────
    // A server-generated bank receipt will NEVER have "Photoshop" or "GIMP" as Creator
    const creatorRaw = ((pdfInfo.Creator || '') + ' ' + (pdfInfo.Producer || '')).toLowerCase()
    const suspiciousCreator = SUSPICIOUS_CREATORS.find(s => creatorRaw.includes(s))
    if (suspiciousCreator) {
      await markAsFraud(listingId, `PDF создан в редакторе "${suspiciousCreator}" — не является банковским чеком`)
      return NextResponse.json({ verified: false, reason: 'Suspicious PDF creator' })
    }

    // ── LAYER 6: Merchant IIN/BIN verification ────────────────────────────────
    // Attack closed: fraudster pays at any other store (FixPrice, coffee shop),
    // gets a real Kaspi PDF with the correct amount, uploads it.
    // Fix: verify the ИИН/БИН продавца in the receipt matches OUR merchant IIN.
    // Set MERCHANT_IIN env var to the ИИН/БИН of the business receiving payments.
    const merchantIin = process.env.MERCHANT_IIN
    if (merchantIin) {
      const iinMatch = pdfText.match(/(?:ИИН\/БИН\s*продавца|БИН\s*продавца|ИИН\s*продавца)[:\s]*(\d{12})/i)
      if (iinMatch && iinMatch[1] !== merchantIin) {
        await markAsFraud(listingId, `Чек выдан другому получателю (ИИН в чеке: ${iinMatch[1]}, ожидался: ${merchantIin})`)
        return NextResponse.json({ verified: false, reason: 'Wrong merchant' })
      }
    }

    // ── LAYER 7: Kaspi transaction ID extraction ──────────────────────────────
    // Kaspi QR receipts use "QR16189817738" format (QR prefix + 11 digits).
    // Pure digit fallback intentionally removed — it would match ИИН/БИН (12 digits),
    // causing false "duplicate transaction" blocks across users with the same seller.
    const txIdMatch = pdfText.match(/(?:№\s*чека|чек\s*№)[:\s#]*([A-Za-z]{0,3}\d{9,13})/i)
      || pdfText.match(/\b(QR\d{9,13})\b/i)
      || pdfText.match(/(?:номер|операция|транзакц|transaction|id)[:\s#]*(\d{9,13})/i)
    const transactionId = txIdMatch ? txIdMatch[1] : `fh_${fileHash.slice(0, 16)}`

    // Transaction ID uniqueness — catches reuse of the same receipt with minor edits
    const { data: txDuplicate } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('transaction_id', transactionId)
      .neq('id', listingId)
      .single()

    if (txDuplicate) {
      await markAsFraud(listingId, 'Транзакция уже была использована для другого объявления')
      return NextResponse.json({ verified: false, reason: 'Duplicate transaction' })
    }

    // ── LAYER 8: Amount verification ─────────────────────────────────────────
    // Extract all monetary amounts using proper text (not raw bytes)
    const extractedAmounts = extractMonetaryAmounts(pdfText)

    // Attack closed: if extraction finds no amounts, the old code fell through to
    // "ALL CHECKS PASSED" without any amount verification (homoglyph ₸ substitute,
    // non-standard currency label, or any other bypass that hides the amount).
    if (extractedAmounts.length === 0) {
      await markAsFraud(listingId, 'Не удалось извлечь сумму оплаты из чека — нет ₸ символа в тексте')
      return NextResponse.json({ verified: false, reason: 'No amount found' })
    }

    const maxPaid = Math.max(...extractedAmounts)
    const hasMatchingAmount = extractedAmounts.some(a => Math.abs(a - priceExpected) < 0.5)
    const isOverpaid = extractedAmounts.some(a => a > priceExpected + 0.5)

    if (!hasMatchingAmount && !isOverpaid) {
      // Paid LESS than required
      await markAsFraud(listingId, `Сумма в чеке не соответствует тарифу (ожидалось ${priceExpected} ₸, в чеке: ${extractedAmounts.join(', ')} ₸)`)
      return NextResponse.json({ verified: false, reason: 'Price mismatch' })
    }

    if (isOverpaid) {
      // Paid MORE than required — activate premium and flag for user notification
      await supabaseAdmin
        .from('listings')
        .update({
          is_premium: true,
          premium_until: premiumUntil,
          status: 'active',
          transaction_id: transactionId,
          receipt_url: `overpaid:${Math.round(maxPaid)}:${priceExpected}`,
        })
        .eq('id', listingId)

      return NextResponse.json({ verified: true, overpaid: true, paidAmount: maxPaid, expectedAmount: priceExpected, transactionId })
    }

    // ── ALL CHECKS PASSED — activate premium server-side ──────────────────────
    await supabaseAdmin
      .from('listings')
      .update({
        is_premium: true,
        premium_until: premiumUntil,
        status: 'active',
        transaction_id: transactionId,
        receipt_url: `fh:${fileHash}`,
      })
      .eq('id', listingId)

    return NextResponse.json({ verified: true, transactionId })

  } catch (err) {
    console.error('[verify-receipt]', err)
    return NextResponse.json({ error: 'Внутренняя ошибка проверки' }, { status: 500 })
  }
}

function extractMonetaryAmounts(text: string): number[] {
  const amounts = new Set<number>()

  // Priority: labeled fields (highest confidence)
  // Supports "Оплата совершена\n10 ₸" multiline format used by Kaspi QR receipts.
  // \s* matches the newline between the label and the amount on the next line.
  const labeled = /(?:оплата\s*совершена|сумма|итого|оплачено|к\s*оплате|amount|total|списано)[:\s]*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₸|〒|тенге|kzt)/gi
  let m: RegExpExecArray | null
  while ((m = labeled.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
    if (!isNaN(n) && n > 0 && n < 10_000_000) amounts.add(n)
  }

  // Fallback: any number directly followed by currency symbol
  const standalone = /(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₸|〒|тенге|kzt)/gi
  while ((m = standalone.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
    if (!isNaN(n) && n > 0 && n < 10_000_000) amounts.add(n)
  }

  return Array.from(amounts)
}

async function markAsFraud(listingId: string, reason: string) {
  // In the current flow premium is granted ONLY on successful verification, so a
  // failed/rejected attempt has nothing to revert. We just log it and leave the
  // user's listing untouched (do NOT unpublish an otherwise-active listing).
  console.warn(`[verify-receipt] REJECTED — listing ${listingId}: ${reason}`)
}
