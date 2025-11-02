"use client"

import { Toaster } from "sonner"

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* ✅ Global Sonner Toaster */}
      <Toaster
        richColors
        position="top-right"
        closeButton
      />
    </>
  )
}
