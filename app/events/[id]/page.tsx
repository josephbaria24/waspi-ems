"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Navigation } from "@/components/navigation"
import { EventDetails } from "@/components/event-details"
import { Loader2 } from "lucide-react"

export default function EventPage() {
    const params = useParams()
    const id = params?.id as string
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation currentEventId={id} />
            <EventDetails
                eventId={id}
                onBack={() => router.push("/")}
            />
        </div>
    )
}
