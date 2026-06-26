/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Tracks request counts per IP address with a sliding window.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 5, windowMs: 10 * 60 * 1000 })
 *   const result = limiter.check(ip)
 *   if (!result.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { maxRequests, windowMs } = options
  // In-memory store — resets when server restarts (fine for Render.com single instance)
  const store = new Map<string, RateLimitEntry>()

  // Periodic cleanup of expired entries to prevent memory leak
  if (typeof globalThis !== 'undefined') {
    setInterval(() => {
      const now = Date.now()
      store.forEach((entry, key) => {
        if (entry.resetAt < now) store.delete(key)
      })
    }, windowMs)
  }

  return {
    check(ip: string): RateLimitResult {
      const now = Date.now()
      const entry = store.get(ip)

      if (!entry || entry.resetAt < now) {
        // First request or window expired — start fresh
        store.set(ip, { count: 1, resetAt: now + windowMs })
        return { ok: true, remaining: maxRequests - 1, resetAt: now + windowMs }
      }

      if (entry.count >= maxRequests) {
        // Limit exceeded
        return { ok: false, remaining: 0, resetAt: entry.resetAt }
      }

      // Increment count
      entry.count++
      store.set(ip, entry)
      return { ok: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
    },
  }
}

/**
 * Extracts the real client IP from a Next.js request.
 * Checks x-forwarded-for (Render/Vercel proxy) then falls back to remote address.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
