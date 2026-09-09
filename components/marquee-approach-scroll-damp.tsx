'use client'

import { useEffect } from 'react'

const SELECTOR = '[data-marquee-scroll-slow]'
/** Narrower band = less time spent in “slow zone” */
const ZONE_MAX_PX = 760
/** Closest approach: fraction of native wheel delta (higher = faster, less “mud”) */
const MIN_MULT = 0.56
/** Larger = snappier; low values linger and feel sluggish */
const BLEND_PER_FRAME = 0.42
/** Stop when remaining scroll is negligible */
const PENDING_EPS = 0.45
/** Soft cap per wheel impulse (pixels, deltaMode-normalized) */
const MAX_DELTA_PER_TICK = 140

/** Wheel delta scaled for DOM_DELTA_LINE / PAGE (best-effort). */
function wheelDeltaPx(e: WheelEvent): number {
  if (e.deltaMode === 1) return e.deltaY * 16
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight
  return e.deltaY
}

function applyScrollDelta(deltaY: number): void {
  const root = document.scrollingElement ?? document.documentElement
  if (!root) return
  const max = Math.max(0, root.scrollHeight - root.clientHeight)
  root.scrollTop = Math.min(max, Math.max(0, root.scrollTop + deltaY))
}

/**
 * Smoothly reduces wheel scroll speed while the marquee block is approaching.
 * Uses rAF interpolation instead of snapping each wheel event.
 *
 * rafId is cleared at the start of each flush tick so a thrown scroll or a
 * cancelled frame cannot leave a stale handle that blocks ensureLoop forever.
 */
export default function MarqueeApproachScrollDamp() {
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced) return

    const zone = Math.min(ZONE_MAX_PX, window.innerHeight * 1.12)

    let pending = 0
    let rafId = 0

    const flush = () => {
      rafId = 0

      try {
        if (Math.abs(pending) < PENDING_EPS) {
          if (pending !== 0) {
            applyScrollDelta(pending)
            pending = 0
          }
          return
        }

        const step = pending * BLEND_PER_FRAME
        applyScrollDelta(step)
        pending -= step
      } catch {
        pending = 0
        return
      }

      rafId = requestAnimationFrame(flush)
    }

    const ensureLoop = () => {
      if (rafId !== 0) return
      rafId = requestAnimationFrame(flush)
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return

      const dyRaw = wheelDeltaPx(e)
      if (Math.abs(e.deltaX) > Math.abs(dyRaw) * 1.15) return

      const el = document.querySelector(SELECTOR) as HTMLElement | null
      if (!el) return

      const root = document.scrollingElement ?? document.documentElement
      if (!root || root.scrollHeight <= root.clientHeight + 1) return

      const top = el.getBoundingClientRect().top

      const inApproachBand = dyRaw > 0 && top > 0 && top <= zone
      const mult = inApproachBand ? MIN_MULT + (1 - MIN_MULT) * (top / zone) : 1
      const damping = mult < 0.993

      const intercept = damping || Math.abs(pending) > PENDING_EPS

      if (!intercept) return

      e.preventDefault()

      let dy = Math.max(-MAX_DELTA_PER_TICK, Math.min(MAX_DELTA_PER_TICK, dyRaw))
      dy *= inApproachBand ? mult : 1

      pending += dy
      ensureLoop()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(rafId)
      rafId = 0
      pending = 0
    }
  }, [])

  return null
}
