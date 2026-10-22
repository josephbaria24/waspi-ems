'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import GlassSurface from '@/components/GlassSurface';

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  navClassName?: string;
  useGlassSurface?: boolean;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  onExpandedChange?: (expanded: boolean) => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  navClassName = '',
  useGlassSurface = false,
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  onExpandedChange,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandedChange?.(expanded);
  };

  const measureExpandedHeight = () => {
    const contentEl = contentRef.current;
    if (!contentEl) return 280;

    const topBar = 60;
    const padding = 16;
    // Content is absolute when closed; measure with a temporary static layout.
    const prev = {
      visibility: contentEl.style.visibility,
      pointerEvents: contentEl.style.pointerEvents,
      position: contentEl.style.position,
      height: contentEl.style.height,
      inset: contentEl.style.inset,
      top: contentEl.style.top,
      bottom: contentEl.style.bottom,
    };

    contentEl.style.visibility = 'hidden';
    contentEl.style.pointerEvents = 'none';
    contentEl.style.position = 'static';
    contentEl.style.height = 'auto';
    contentEl.style.top = 'auto';
    contentEl.style.bottom = 'auto';

    const contentHeight = contentEl.scrollHeight;

    contentEl.style.visibility = prev.visibility;
    contentEl.style.pointerEvents = prev.pointerEvents;
    contentEl.style.position = prev.position;
    contentEl.style.height = prev.height;
    contentEl.style.top = prev.top;
    contentEl.style.bottom = prev.bottom;

    return topBar + contentHeight + padding;
  };

  useLayoutEffect(() => {
    if (!isExpanded) {
      setExpandedHeight(null);
      return;
    }
    const height = measureExpandedHeight();
    setExpandedHeight(height);

    // Soft fade-in for cards (optional; height is CSS/state driven)
    const cards = cardsRef.current.filter(Boolean);
    if (cards.length) {
      gsap.fromTo(
        cards,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28, ease, stagger: 0.05, overwrite: true },
      );
    }
  }, [isExpanded, items, ease, useGlassSurface]);

  useLayoutEffect(() => {
    const onResize = () => {
      if (!isExpanded) return;
      setExpandedHeight(measureExpandedHeight());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const nextOpen = !isExpanded;
    setIsHamburgerOpen(nextOpen);
    if (nextOpen) {
      // Measure before expanding so Safari gets a concrete height immediately
      setExpandedHeight(measureExpandedHeight());
      setExpanded(true);
    } else {
      setExpanded(false);
      setExpandedHeight(null);
    }
  };

  const onHamburgerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const navStyle: React.CSSProperties = {
    backgroundColor: useGlassSurface ? 'transparent' : baseColor,
    height: isExpanded ? expandedHeight ?? 'auto' : 60,
    transition: 'height 0.35s ease',
    overflow: 'hidden',
    ...(useGlassSurface ? { boxShadow: 'none', border: 'none' } : null),
  };

  const hamburger = (
    <button
      type="button"
      className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group relative z-20 flex min-h-11 min-w-11 shrink-0 touch-manipulation flex-col items-center justify-center gap-[6px] rounded-lg md:hidden`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
      }}
      onKeyDown={onHamburgerKeyDown}
      aria-label={isExpanded ? 'Close menu' : 'Open menu'}
      aria-expanded={isExpanded}
      style={{ color: menuColor || '#000', WebkitTapHighlightColor: 'transparent' }}
    >
      <span
        className={`hamburger-line block h-[2px] w-[22px] bg-current transition-transform duration-300 ease-linear [transform-origin:50%_50%] ${
          isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
        }`}
      />
      <span
        className={`hamburger-line block h-[2px] w-[22px] bg-current transition-transform duration-300 ease-linear [transform-origin:50%_50%] ${
          isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
        }`}
      />
    </button>
  );

  const topBar = (
    <div className="card-nav-top absolute inset-x-0 top-0 z-[2] flex h-[60px] items-center justify-between gap-3 p-2 pl-[1.1rem]">
      <div className="flex items-center gap-3">
        {hamburger}
        <Link href="/" className="logo-container flex min-w-0 items-center gap-2">
          <img src={logo} alt={logoAlt} className="logo h-[28px] shrink-0" />
          <span className="truncate text-sm font-semibold tracking-tight text-[#1E1E1E] md:hidden">
            WASPI Membership
          </span>
        </Link>
      </div>

      <div className="hidden items-center gap-6 text-sm font-medium md:flex" style={{ color: menuColor || '#1E1E1E' }}>
        {(items || []).map((item) => {
          const href = item.links?.[0]?.href;
          if (!href) return null;
          return (
            <a key={item.label} href={href} className="rounded-md transition-opacity duration-200 hover:opacity-70">
              {item.label}
            </a>
          );
        })}
      </div>

      <Link
        href="/register"
        className="card-nav-cta-button hidden h-full items-center rounded-[calc(0.75rem-0.2rem)] border-0 px-4 font-medium transition-colors duration-300 md:inline-flex"
        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
      >
        Get Started
      </Link>
    </div>
  );

  const content = (
    <div
      ref={contentRef}
      className={`card-nav-content absolute bottom-0 left-0 right-0 top-[60px] z-[1] flex flex-col items-stretch justify-start gap-2 p-2 md:flex-row md:items-end md:gap-[12px] ${
        isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!isExpanded}
    >
      {(items || []).map((item, idx) => (
        <div
          key={`${item.label}-${idx}`}
          className="nav-card relative flex min-h-[60px] min-w-0 flex-[1_1_auto] select-none flex-col gap-2 rounded-[calc(0.75rem-0.2rem)] p-[12px_16px] md:h-full md:min-h-0 md:flex-[1_1_0%]"
          ref={setCardRef(idx)}
          style={{ backgroundColor: item.bgColor, color: item.textColor }}
        >
          <div className="nav-card-label text-[18px] font-normal tracking-[-0.5px] md:text-[22px]">{item.label}</div>
          <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
            {item.links?.map((lnk, i) => (
              <a
                key={`${lnk.label}-${i}`}
                className="nav-card-link inline-flex cursor-pointer items-center gap-[6px] text-[15px] no-underline transition-opacity duration-300 hover:opacity-75 md:text-[16px]"
                href={lnk.href}
                aria-label={lnk.ariaLabel}
                onClick={() => {
                  // Close after choosing a section on mobile
                  setIsHamburgerOpen(false);
                  setExpanded(false);
                  setExpandedHeight(null);
                }}
              >
                <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                {lnk.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`card-nav-container absolute left-1/2 top-[1.2em] z-[99] w-[90%] max-w-[800px] -translate-x-1/2 md:top-[2em] ${className}`}
    >
      {useGlassSurface ? (
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={16}
          borderWidth={0.08}
          blur={18}
          brightness={70}
          opacity={0.95}
          backgroundOpacity={0.94}
          saturation={1.8}
          displace={0.4}
          className="nav-glass-frost h-auto w-full"
        >
          <div
            ref={(el) => {
              navRef.current = el;
            }}
            className={`card-nav ${isExpanded ? 'open' : ''} relative block w-full overflow-hidden rounded-xl bg-transparent p-0 will-change-[height] ${navClassName}`}
            style={navStyle}
          >
            {topBar}
            {content}
          </div>
        </GlassSurface>
      ) : (
        <nav
          ref={(el) => {
            navRef.current = el;
          }}
          className={`card-nav ${isExpanded ? 'open' : ''} relative block overflow-hidden rounded-xl p-0 shadow-md will-change-[height] ${navClassName}`}
          style={navStyle}
        >
          {topBar}
          {content}
        </nav>
      )}
    </div>
  );
};

export default CardNav;
