//components/download-certificates-modal.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Download, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface Attendee {
  id: number
  personal_name: string
  middle_name: string | null
  last_name: string
  email: string
  reference_id: string
  hasevaluation: boolean
}

interface DownloadCertificatesModalProps {
  eventId: number
  eventName: string
  open: boolean
  onClose: () => void
}

export default function DownloadCertificatesModal({
  eventId,
  eventName,
  open,
  onClose,
}: DownloadCertificatesModalProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Fetch attendees when modal opens
  useEffect(() => {
    if (open) {
      fetchAttendees()
      setSelectedIds(new Set())
      setSearchQuery("")
    }
  }, [open, eventId])

  const fetchAttendees = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("attendees")
        .select("id, personal_name, middle_name, last_name, email, reference_id, hasevaluation")
        .eq("event_id", eventId)
        .order("last_name", { ascending: true })

      if (error) throw error
      setAttendees(data || [])
    } catch (error) {
      console.error("Error fetching attendees:", error)
      alert("Failed to load attendees")
    } finally {
      setLoading(false)
    }
  }

  // Filter attendees based on search
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees

    const query = searchQuery.toLowerCase()
    return attendees.filter((attendee) => {
      const fullName = `${attendee.personal_name} ${attendee.middle_name || ""} ${attendee.last_name}`.toLowerCase()
      const email = attendee.email?.toLowerCase() || ""
      return fullName.includes(query) || email.includes(query)
    })
  }, [attendees, searchQuery])

  // Check if all filtered attendees are selected
  const allSelected = filteredAttendees.length > 0 && 
    filteredAttendees.every((a) => selectedIds.has(a.id))

  // Toggle select all
  const toggleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered attendees
      const newSelected = new Set(selectedIds)
      filteredAttendees.forEach((a) => newSelected.delete(a.id))
      setSelectedIds(newSelected)
    } else {
      // Select all filtered attendees
      const newSelected = new Set(selectedIds)
      filteredAttendees.forEach((a) => newSelected.add(a.id))
      setSelectedIds(newSelected)
    }
  }

  // Toggle individual selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Download certificates
  const handleDownload = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one attendee")
      return
    }

    setDownloading(true)
    try {
      const selectedAttendees = attendees.filter((a) => selectedIds.has(a.id))
      
      for (const attendee of selectedAttendees) {
        try {
          const response = await fetch("/api/generate-certificate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referenceId: attendee.reference_id,
            }),
          })

          if (!response.ok) {
            console.error(`Failed to generate certificate for ${attendee.personal_name} ${attendee.last_name}`)
            continue
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `Certificate_${attendee.personal_name}_${attendee.last_name}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          // Small delay between downloads to avoid overwhelming the browser
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Error downloading certificate for ${attendee.personal_name}:`, error)
        }
      }

      alert(`Successfully downloaded ${selectedIds.size} certificate(s)`)
      onClose()
    } catch (error) {
      console.error("Error downloading certificates:", error)
      alert("Failed to download certificates")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Download Certificates</DialogTitle>
          <DialogDescription>
            Select attendees to download their certificates. Only attendees who completed evaluations are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All */}
          {filteredAttendees.length > 0 && (
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Select All ({selectedIds.size} selected)
              </label>
            </div>
          )}

          {/* Attendees List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No attendees found matching your search" : "No attendees with completed evaluations"}
              </div>
            ) : (
              filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => toggleSelection(attendee.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(attendee.id)}
                    onCheckedChange={() => toggleSelection(attendee.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {attendee.personal_name} {attendee.middle_name || ""} {attendee.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{attendee.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={downloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={selectedIds.size === 0 || downloading}>
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}