"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

type Props = {
  id?: string
  className?: string
  children: ReactNode
}

export function LandingSection({ id, className, children }: Props) {
  const prefersReducedMotion = useReducedMotion()

  const staticLayout = prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }

  return (
    <motion.section
      id={id}
      className={className}
      initial={staticLayout}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "-56px 0px -40px 0px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.section>
  )
}
