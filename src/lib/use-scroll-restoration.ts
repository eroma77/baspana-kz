'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Module-level store of scroll positions, keyed by route (+ optional suffix).
// Survives client-side navigation because the SPA keeps the JS runtime alive,
// so leaving a list and coming back restores the exact scroll offset.
const positions = new Map<string, number>()

/**
 * Restores (and persists) the vertical scroll position of an inner scroll
 * container across client-side navigation.
 *
 * The app shell uses `overflow: hidden` with a per-page `overflow-y-auto`
 * container, so Next.js' built-in (window-based) scroll restoration does not
 * apply — we handle it manually here.
 *
 * @param extraKey optional discriminator (e.g. the active mode/tab) so two
 *                 different lists on the same route keep separate positions.
 */
export function useScrollRestoration<T extends HTMLElement = HTMLDivElement>(extraKey = '') {
  const ref = useRef<T>(null)
  const pathname = usePathname()
  const key = `${pathname}::${extraKey}`

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const saved = positions.get(key)
    if (saved != null && saved > 0) {
      el.scrollTop = saved
      // Re-apply once more after layout settles (late images / async content
      // can shift height between mount and first paint).
      requestAnimationFrame(() => {
        if (ref.current) ref.current.scrollTop = saved
      })
    }

    const onScroll = () => {
      positions.set(key, el.scrollTop)
    }
    el.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      // Persist the final position on unmount (e.g. before navigating away).
      positions.set(key, el.scrollTop)
      el.removeEventListener('scroll', onScroll)
    }
  }, [key])

  return ref
}
