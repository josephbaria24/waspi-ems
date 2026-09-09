'use client'

import { useEffect, useMemo, useState } from 'react'
import CardNav, { type CardNavItem } from '@/components/CardNav'

const NAV_ITEMS: CardNavItem[] = [
  {
    label: 'About',
    bgColor: '#EAF9F1',
    textColor: '#1E1E1E',
    links: [{ label: 'About', href: '#about', ariaLabel: 'Go to About section' }],
  },
  {
    label: 'Mission',
    bgColor: '#E9F6FF',
    textColor: '#1E1E1E',
    links: [{ label: 'Mission', href: '#mission', ariaLabel: 'Go to Mission section' }],
  },
  {
    label: 'Benefits',
    bgColor: '#F3F4F6',
    textColor: '#1E1E1E',
    links: [{ label: 'Benefits', href: '#benefits', ariaLabel: 'Go to Benefits section' }],
  },
  {
    label: 'Contact',
    bgColor: '#F4F4F5',
    textColor: '#1E1E1E',
    links: [{ label: 'Contact', href: '#contact', ariaLabel: 'Go to Contact section' }],
  },
]

export default function StickyCardNav() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const diff = y - lastY

      if (y <= 20) {
        setVisible(true)
      } else if (diff > 5) {
        setVisible(false)
      } else if (diff < -5) {
        setVisible(true)
      }

      lastY = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shellClassName = useMemo(
    () =>
      [
        '!fixed !top-4 !left-1/2 !z-[120] !w-[min(94vw,980px)] !max-w-none !-translate-x-1/2',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-[120%] opacity-95',
      ].join(' '),
    [visible]
  )

  return (
    <CardNav
      logo="/logo.png"
      logoAlt="WASPI logo"
      items={NAV_ITEMS}
      className={shellClassName}
      useGlassSurface
      navClassName="!rounded-2xl backdrop-blur-2xl"
      baseColor="transparent"
      menuColor="#1E1E1E"
      buttonBgColor="#00D47E"
      buttonTextColor="#0F1113"
    />
  )
}
