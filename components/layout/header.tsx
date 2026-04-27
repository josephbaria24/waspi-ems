'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  onLogout?: () => void
  showLogout?: boolean
}

export function Header({ title, onLogout, showLogout = false }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">W</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-foreground/70 hover:text-foreground transition">
            Home
          </Link>
          {showLogout && (
            <Button 
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-muted"
            >
              Logout
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
