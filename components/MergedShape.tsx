import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MergedShapeProps {
  children: ReactNode
  className?: string
  cutoutClassName?: string
}

export default function MergedShape({ children, className, cutoutClassName }: MergedShapeProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-[32px]', className)}>
      {children}

      {/* Bottom-right cutout to create the merged/notched silhouette */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute bottom-0 right-0 h-[21.4286%] w-[51.2195%] rounded-tl-[32px] bg-white',
          cutoutClassName
        )}
      />
    </div>
  )
}
