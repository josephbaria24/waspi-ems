'use client'

import { useState, useRef } from 'react'

interface MembershipCard3DProps {
  variant?: 'select' | 'display'
  type: 'standard' | 'premium' | 'elite'
  name: string
  price?: string
  selected?: boolean
  onSelect?: () => void
  trackingNumber?: string
  expiryDate?: string
}

const cardStyles = {
  standard: {
    gradient: 'from-slate-400 via-slate-300 to-slate-500',
    accent: 'bg-slate-600',
    shine: 'from-white/40 via-white/20 to-transparent',
    border: 'border-slate-400',
    text: 'text-slate-800',
    chip: 'from-yellow-600 to-yellow-400',
    label: 'Student'
  },
  premium: {
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    accent: 'bg-amber-700',
    shine: 'from-white/50 via-white/30 to-transparent',
    border: 'border-amber-400',
    text: 'text-amber-900',
    chip: 'from-yellow-700 to-yellow-500',
    label: 'Professional'
  },
  elite: {
    gradient: 'from-gray-900 via-gray-700 to-black',
    accent: 'bg-gray-900',
    shine: 'from-white/30 via-white/10 to-transparent',
    border: 'border-gray-600',
    text: 'text-white',
    chip: 'from-yellow-500 to-yellow-300',
    label: 'Organizational'
  },
}

export function MembershipCard3D({ 
  variant = 'select',
  type, 
  name, 
  price = "₱0/mo", 
  selected, 
  onSelect,
  trackingNumber,
  expiryDate
}: MembershipCard3DProps) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  const style = cardStyles[type] || cardStyles.standard

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotateXValue = (mouseY / (rect.height / 2)) * -15
    const rotateYValue = (mouseX / (rect.width / 2)) * 15

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)

    const glareX = ((e.clientX - rect.left) / rect.width) * 100
    const glareY = ((e.clientY - rect.top) / rect.height) * 100
    setGlarePosition({ x: glareX, y: glareY })
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setGlarePosition({ x: 50, y: 50 })
  }

  return (
    <div
      className="perspective-1000 w-full cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={onSelect}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative h-[128px] w-full rounded-xl transition-all duration-200 ease-out sm:h-[164px] lg:h-[202px] ${
          selected ? 'ring-2 ring-primary ring-offset-1 sm:ring-4 sm:ring-offset-2' : 'hover:brightness-[1.03]'
        }`}
        style={{
          width: '100%',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${style.gradient} ${style.border} border-2 shadow-2xl overflow-hidden`}
        >
          {/* Glare effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${style.shine} opacity-60 pointer-events-none`}
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)`,
            }}
          />

          {/* Decorative circles */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-32 h-32 border border-white/20 rounded-full"
                  style={{
                    top: `${20 + i * 15}%`,
                    left: `${60 + i * 10}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-4 lg:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-[9px] font-bold uppercase tracking-widest opacity-70 sm:text-[10px] ${style.text}`}>
                  WASPI {variant === 'display' ? style.label : ''}
                </p>
                <h3 className={`mt-0.5 truncate text-sm font-bold sm:text-lg lg:text-xl ${style.text}`}>{name}</h3>
              </div>
              <div className={`h-5 w-7 shrink-0 rounded bg-gradient-to-br sm:h-6 sm:w-8 lg:h-7 lg:w-10 ${style.chip} shadow-inner`}>
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-3 w-4 rounded-sm border border-yellow-800/30 sm:h-4 sm:w-6" />
                </div>
              </div>
            </div>

            <div>
              {variant === 'select' ? (
                <div className="flex items-baseline gap-1">
                  <span className={`text-base font-bold sm:text-xl lg:text-2xl ${style.text}`}>{price.split('/')[0]}</span>
                  <span className={`text-xs opacity-70 sm:text-sm ${style.text}`}>/{price.split('/')[1] || 'mo'}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className={`text-[10px] font-bold ${style.text} opacity-60 uppercase tracking-tighter`}>Tracking Number</p>
                  <p className={`text-lg font-mono font-bold ${style.text} tracking-wider`}>
                    {trackingNumber || 'PENDING'}
                  </p>
                </div>
              )}
              
              <div className="mt-1 flex items-end justify-between sm:mt-2">
                <div className="flex gap-1.5 sm:gap-2">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className={`font-mono text-[8px] tracking-widest opacity-40 sm:text-[10px] ${style.text}`}>
                      ••••
                    </span>
                  ))}
                </div>
                {variant === 'display' && expiryDate && (
                  <div className="text-right">
                    <p className={`text-[8px] font-bold ${style.text} opacity-50 uppercase`}>Valid Thru</p>
                    <p className={`text-[10px] font-bold ${style.text}`}>{new Date(expiryDate).toLocaleDateString(undefined, { month: '2-digit', year: '2-digit' })}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(${105 + rotateY}deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)`,
            }}
          />
        </div>

        {variant === 'select' && selected && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg z-20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
