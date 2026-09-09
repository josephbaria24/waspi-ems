import type { ReactNode } from "react"
import Link from "next/link"
import { Home } from "lucide-react"

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #16a34a 100%)", // Blue → Green
      }}
    >
      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-gray-900 shadow-md transition-colors hover:bg-white sm:left-6 sm:top-6"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>
      {children}
    </div>
  )
}
