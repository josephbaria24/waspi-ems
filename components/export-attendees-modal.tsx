"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Download, FileSpreadsheet } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import * as XLSX from "xlsx"

interface ExportAttendeesModalProps {
  eventId: number
  eventName: string
  open: boolean
  onClose: () => void
}

export default function ExportAttendeesModal({ eventId, eventName, open, onClose }: ExportAttendeesModalProps) {
  const [loading, setLoading] = useState(false)

  const formatDate = (date: string | null) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString()
  }

  const formatAttendance = (attendance: any) => {
    if (!attendance || !Array.isArray(attendance)) return ""
    
    return attendance
      .map((a: any) => {
        const date = new Date(a.date).toLocaleDateString()
        return `${date}: ${a.status}`
      })
      .join("; ")
  }

  const formatPayments = (payments: any) => {
    if (!payments) return ""
    if (typeof payments === "string") return payments
    if (typeof payments === "object") return JSON.stringify(payments)
    return String(payments)
  }

  const exportToExcel = async () => {
    setLoading(true)
    
    try {
      // Fetch all attendees for this event
      const { data: attendees, error } = await supabase
        .from("attendees")
        .select("*")
        .eq("event_id", eventId)
        .order("id", { ascending: true })

      if (error) {
        console.error("Error fetching attendees:", error)
        alert("❌ Failed to fetch attendees")
        setLoading(false)
        return
      }

      if (!attendees || attendees.length === 0) {
        alert("⚠️ No attendees found for this event")
        setLoading(false)
        return
      }

      // Transform data for Excel
      const excelData = attendees.map((attendee) => ({
        "ID": attendee.id,
        "Reference ID": attendee.reference_id || "",
        "First Name": attendee.personal_name || "",
        "Middle Name": attendee.middle_name || "",
        "Last Name": attendee.last_name || "",
        "Email": attendee.email || "",
        "Mobile Number": attendee.mobile_number || "",
        "Date of Birth": formatDate(attendee.date_of_birth),
        "Address": attendee.address || "",
        "Company": attendee.company || "",
        "Position": attendee.position || "",
        "Company Address": attendee.company_address || "",
        "Status": attendee.status || "Pending",
        "Payment Status": attendee.payment_status || "Pending",
        "Payments": formatPayments(attendee.payments),
        "Attendance": formatAttendance(attendee.attendance),
        "Has Evaluation": attendee.hasevaluation ? "Yes" : "No",
        "Has Sent Evaluation": attendee.hassentevaluation ? "Yes" : "No",
        "Created At": formatDate(attendee.created_at),
        "Updated At": formatDate(attendee.updated_at),
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 6 },   // ID
        { wch: 20 },  // Reference ID
        { wch: 15 },  // First Name
        { wch: 15 },  // Middle Name
        { wch: 15 },  // Last Name
        { wch: 25 },  // Email
        { wch: 15 },  // Mobile Number
        { wch: 12 },  // Date of Birth
        { wch: 30 },  // Address
        { wch: 20 },  // Company
        { wch: 20 },  // Position
        { wch: 30 },  // Company Address
        { wch: 12 },  // Status
        { wch: 15 },  // Payment Status
        { wch: 30 },  // Payments
        { wch: 40 },  // Attendance
        { wch: 15 },  // Has Evaluation
        { wch: 18 },  // Has Sent Evaluation
        { wch: 18 },  // Created At
        { wch: 18 },  // Updated At
      ]
      ws["!cols"] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Attendees")

      // Generate filename with event name and date
      const fileName = `${eventName.replace(/[^a-z0-9]/gi, "_")}_Attendees_${new Date().toISOString().split("T")[0]}.xlsx`

      // Download file
      XLSX.writeFile(wb, fileName)

      alert(`✅ Successfully exported ${attendees.length} attendee(s)!`)
      onClose()
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      alert("❌ Failed to export attendees")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Attendees to Excel
          </DialogTitle>
          <DialogDescription>
            Download all attendee information for <strong>{eventName}</strong> as an Excel file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">Excel file will include:</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Personal information (Name, Email, Phone, etc.)</li>
              <li>Company details (if provided)</li>
              <li>Payment status and payment records</li>
              <li>Attendance records with dates</li>
              <li>Evaluation status</li>
              <li>Reference IDs and timestamps</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={exportToExcel} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}