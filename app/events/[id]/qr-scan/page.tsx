"use client"

import { Navigation } from "@/components/navigation"
import { QRScanner } from "@/components/qr-scanner"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

export default function QRScanPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentEventId={id} />
      <div className="relative">
        <div className="p-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/events/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event Details
          </Button>
        </div>
        <QRScanner eventId={id} />
      </div>
    </div>
  )
}