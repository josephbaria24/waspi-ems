"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Navigation } from "@/components/navigation"
import { EventsDashboard } from "@/components/events-dashboard"
import { EventDetails } from "@/components/event-details"
import { QRScanner } from "@/components/qr-scanner"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type ViewMode = "dashboard" | "details" | "qr-scan"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login")
      } else {
        setLoading(false)
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <EventsDashboard onSelectEvent={handleSelectEvent} />
    </div>
  )
}