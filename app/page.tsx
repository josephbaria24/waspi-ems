"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase-client"
import { Navigation } from "@/components/navigation"
import { EventsDashboard } from "@/components/events-dashboard"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSelectEvent = (id: string) => {
    router.push(`/events/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If logged in to EMS, show the dashboard
  if (session) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <EventsDashboard onSelectEvent={handleSelectEvent} />
      </div>
    )
  }

  // Otherwise, show the beautiful Landing Page
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
      {/* ───────── NAVIGATION ───────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden shadow-sm border border-gray-100 bg-white">
              <Image 
                src="/logo.png" 
                alt="WASPI Logo" 
                width={40} 
                height={40} 
                className="object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-emerald-700">
              WASPI
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">About</a>
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium text-gray-600 hover:text-emerald-600 cursor-pointer">
                EMS Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 text-sm font-semibold shadow-md shadow-emerald-200 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-300">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            <a href="#about" className="block text-sm font-medium text-gray-600 hover:text-emerald-600 py-2">About</a>
            <Link href="/login" className="block text-sm font-medium text-gray-600 hover:text-emerald-600 py-2">EMS Login</Link>
            <Link href="/register">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-semibold shadow-md">
                Become a Member
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ───────── HERO SECTION ───────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-50 blur-3xl opacity-60" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-50 blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Welcome to WASPI Portal</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Workplace Advocates on{' '}
                <span className="text-emerald-600">Safety</span>{' '}
                in the Philippines
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                The official portal for WASPI members and event management. Access resources, manage your membership, or coordinate nationwide safety events.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 h-auto text-base font-semibold rounded-full shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all cursor-pointer">
                    Become a Member
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-700 px-8 py-3 h-auto text-base font-semibold rounded-full transition-all cursor-pointer">
                    Event Management
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-3xl -rotate-3 scale-105 opacity-60" />
                <Image
                  src="/hero-illustration.png"
                  alt="Workplace safety illustration"
                  width={600}
                  height={500}
                  className="relative rounded-2xl object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t border-gray-100 bg-gray-50/40 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-emerald-700">WASPI</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Workplace Advocates on Safety in the Philippines Inc. — promoting safety for every worker.
              </p>
            </div>
            <div className="text-center md:text-right md:col-span-2">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} WASPI — Workplace Advocates on Safety in the Philippines Inc.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}