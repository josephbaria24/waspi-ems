'use client'

import { useEffect, useState } from 'react'

const MOBILE_MQ = '(max-width: 767px)'

/** True on phones; false during SSR / first paint to avoid hydration mismatch. */
export function useIsMobileClient() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MQ)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return isMobile
}
