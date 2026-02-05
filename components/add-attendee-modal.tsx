"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

interface AddAttendeeModalProps {
    eventId: number
    eventName: string
    open: boolean
    onClose: () => void
    onAttendeeAdded?: () => void
}

export default function AddAttendeeModal({ eventId, eventName, open, onClose, onAttendeeAdded }: AddAttendeeModalProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        personal_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        mobile_number: "",
        date_of_birth: "",
        address: "",
        company: "",
        position: "",
        company_address: "",
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const generateReferenceId = () => {
        const timestamp = Date.now().toString(36)
        const randomStr = Math.random().toString(36).substring(2, 15)
        return `${timestamp}-${randomStr}`.toUpperCase()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const insertData = {
                personal_name: formData.personal_name.trim(),
                middle_name: formData.middle_name.trim() || null,
                last_name: formData.last_name.trim(),
                email: formData.email.trim() || null,
                mobile_number: formData.mobile_number.trim() || null,
                date_of_birth: formData.date_of_birth || null,
                address: formData.address.trim() || null,
                company: formData.company.trim() || null,
                position: formData.position.trim() || null,
                company_address: formData.company_address.trim() || null,
                event_id: eventId,
                status: "Pending",
                reference_id: generateReferenceId(),
                hasevaluation: false,
                hassentevaluation: false,
                payment_status: "Pending",
            }

            const { error } = await supabase
                .from("attendees")
                .insert(insertData)

            if (error) throw error

            toast({
                title: "Success",
                description: "Attendee added successfully.",
            })
            if (onAttendeeAdded) onAttendeeAdded()
            onClose()
            setFormData({
                personal_name: "",
                middle_name: "",
                last_name: "",
                email: "",
                mobile_number: "",
                date_of_birth: "",
                address: "",
                company: "",
                position: "",
                company_address: "",
            })
        } catch (error: any) {
            console.error("Error adding attendee:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to add attendee.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Attendee to {eventName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Personal Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="personal_name">First Name *</Label>
                                <Input id="personal_name" required value={formData.personal_name} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <Input id="middle_name" value={formData.middle_name} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input id="last_name" required value={formData.last_name} onChange={handleInputChange} disabled={loading} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile_number">Mobile Number</Label>
                                <Input id="mobile_number" value={formData.mobile_number} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth">Date of Birth</Label>
                                <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} disabled={loading} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={formData.address} onChange={handleInputChange} disabled={loading} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Company Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input id="company" value={formData.company} onChange={handleInputChange} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Position</Label>
                                <Input id="position" value={formData.position} onChange={handleInputChange} disabled={loading} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_address">Company Address</Label>
                            <Input id="company_address" value={formData.company_address} onChange={handleInputChange} disabled={loading} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Attendee"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
