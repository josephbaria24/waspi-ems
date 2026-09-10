//components\register-page.tsx
"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CheckCircle2, Upload, Edit2, X, Crop, UserCog } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface EventData {
  id: number
  name: string
  price: number
  venue: string
  start_date: string
  end_date: string
  feature_image?: string
  description?: string
}

export default function RegisterPage({ eventRef }: { eventRef?: string }) {
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
  const [submitted, setSubmitted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dataPrivacyAgreed, setDataPrivacyAgreed] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 1200, height: 628 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropImageRef = useRef<HTMLImageElement>(null)

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

  const searchParams = useSearchParams()
  const ref = eventRef || searchParams.get("ref")

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAdmin(!!session)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const fetchEvent = async () => {
      if (!ref) {
        setLoading(false)
        return
      }

      const selectCols = "id, name, price, venue, start_date, end_date, feature_image, description"

      let { data, error } = await supabase
        .from("events")
        .select(selectCols)
        .eq("magic_link", ref)
        .maybeSingle()

      if (!data) {
        const byAlias = await supabase
          .from("events")
          .select(selectCols)
          .contains("magic_link_aliases", [String(ref).toLowerCase()])
          .maybeSingle()
        data = byAlias.data
        error = byAlias.error || error
      }

      if (error && !data) {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load event details.",
        })
      }

      setEvent(data)
      setLoading(false)
    }

    fetchEvent()
  }, [ref, toast])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !event) {
      console.log('No file selected or no event')
      return
    }

    const file = e.target.files[0]
    console.log('File selected:', file.name, file.size, file.type)

    setOriginalFile(file)

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.src = objectUrl

    img.onload = () => {
      console.log('Image dimensions:', img.width, 'x', img.height)

      const targetRatio = 1200 / 628
      const imageRatio = img.width / img.height

      let cropWidth, cropHeight
      if (imageRatio > targetRatio) {
        cropHeight = img.height
        cropWidth = cropHeight * targetRatio
      } else {
        cropWidth = img.width
        cropHeight = cropWidth / targetRatio
      }

      const x = (img.width - cropWidth) / 2
      const y = (img.height - cropHeight) / 2

      setCropArea({ x, y, width: cropWidth, height: cropHeight })
      setImageToCrop(objectUrl)
      setShowCropModal(true)
    }

    img.onerror = () => {
      console.error('Failed to load image')
      toast({
        variant: "destructive",
        title: "Invalid Image",
        description: "Failed to load image file.",
      })
      URL.revokeObjectURL(objectUrl)
    }

    e.target.value = ''
  }

  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleCropMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !cropImageRef.current) return

    const img = cropImageRef.current
    const rect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height

    const deltaX = (e.clientX - dragStart.x) * scaleX
    const deltaY = (e.clientY - dragStart.y) * scaleY

    setCropArea(prev => {
      const newX = Math.max(0, Math.min(prev.x + deltaX, img.naturalWidth - prev.width))
      const newY = Math.max(0, Math.min(prev.y + deltaY, img.naturalHeight - prev.height))
      return { ...prev, x: newX, y: newY }
    })

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart])

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleCropMouseMove)
      window.addEventListener('mouseup', handleCropMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleCropMouseMove)
        window.removeEventListener('mouseup', handleCropMouseUp)
      }
    }
  }, [isDragging, handleCropMouseMove, handleCropMouseUp])

  const handleCropConfirm = async () => {
    if (!imageToCrop || !originalFile || !event) return

    setUploading(true)

    try {
      const img = new Image()
      img.src = imageToCrop

      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 628
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Failed to get canvas context')

      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        1200,
        628
      )

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
      })

      const fileExt = 'jpg'
      const fileName = `${event.id}-${Date.now()}.${fileExt}`
      const filePath = `featured-image/${fileName}`

      console.log('Upload path:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        })

      console.log('Upload response:', { data: uploadData, error: uploadError })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      const { data: updateData, error: updateError } = await supabase
        .from('events')
        .update({ feature_image: publicUrl })
        .eq('id', event.id)

      console.log('Update response:', { data: updateData, error: updateError })

      if (updateError) {
        console.error('Update error details:', updateError)
        throw updateError
      }

      setEvent({ ...event, feature_image: publicUrl })
      setEditMode(false)
      setShowCropModal(false)
      setImageToCrop(null)

      toast({
        title: "Success",
        description: "Feature image uploaded successfully.",
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error?.message || "Failed to upload image. Please try again.",
      })
    } finally {
      setUploading(false)
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop)
      }
    }
  }

  const handleCropCancel = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    setShowCropModal(false)
    setImageToCrop(null)
    setOriginalFile(null)
  }

  const handleRemoveImage = async () => {
    if (!event) return

    try {
      const { error } = await supabase
        .from('events')
        .update({ feature_image: null })
        .eq('id', event.id)

      if (error) throw error

      setEvent({ ...event, feature_image: undefined })
      setEditMode(false)

      toast({
        title: "Success",
        description: "Feature image removed.",
      })
    } catch (error) {
      console.error('Remove error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove image.",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || submitting || submitLock.current) return
    submitLock.current = true

    if (!dataPrivacyAgreed) {
      toast({
        variant: "destructive",
        title: "Agreement Required",
        description: "Please agree to the data privacy policy to continue.",
      })
      return
    }

    setSubmitting(true)

    try {
      const generateReferenceId = () => {
        const timestamp = Date.now().toString(36)
        const randomStr = Math.random().toString(36).substring(2, 15)
        const moreRandom = Math.random().toString(36).substring(2, 15)
        return `${timestamp}-${randomStr}-${moreRandom}`.toUpperCase()
      }

      const insertData = {
        personal_name: formData.personal_name.trim(),
        middle_name: formData.middle_name.trim() || null,
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        mobile_number: formData.mobile_number.trim(),
        date_of_birth: formData.date_of_birth || null,
        address: formData.address.trim(),
        company: formData.company.trim() || null,
        position: formData.position.trim() || null,
        company_address: formData.company_address.trim() || null,
        event_id: event.id,
        status: "Pending",
        reference_id: generateReferenceId(),
        hasevaluation: false,
        hassentevaluation: false,
      }

      const { data, error } = await supabase
        .from("attendees")
        .insert(insertData)
        .select()

      if (error) {
        console.error("❌ Supabase error:", error)
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message || "Unable to complete your registration. Please try again.",
        })
      } else {
        if (data && data.length > 0) {
          const attendee = data[0]

          // Send confirmation email to attendee
          await fetch("/api/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: attendee.email,
              name: `${attendee.personal_name} ${attendee.last_name}`,
              reference_id: attendee.reference_id,
              event_name: event.name,
              venue: event.venue,
              link: `${window.location.origin}/submission/${encodeURIComponent(attendee.reference_id)}`,
            }),
          })

          // Send notification to admin
          await fetch("/api/send-admin-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personal_name: attendee.personal_name,
              middle_name: attendee.middle_name,
              last_name: attendee.last_name,
              email: attendee.email,
              mobile_number: attendee.mobile_number,
              date_of_birth: attendee.date_of_birth,
              address: attendee.address,
              company: attendee.company,
              position: attendee.position,
              company_address: attendee.company_address,
              reference_id: attendee.reference_id,
              event_name: event.name,
              venue: event.venue,
              price: event.price,
            }),
          })
        }

        setSubmitted(true)
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7FBF8]">
        <Card className="w-full max-w-md rounded-3xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#00D47E]" />
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7FBF8] p-4">
        <Card className="w-full max-w-md rounded-3xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1E1E1E]">Invalid Event Link</CardTitle>
            <CardDescription className="text-[#8D959D]">
              The registration link you're trying to access is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7FBF8] p-4">
        <Card className="w-full max-w-md rounded-3xl border border-[#E8EAEB] bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="rounded-full bg-[#00D47E] p-6 text-[#0B1F14]">
                <CheckCircle2 className="h-16 w-16" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-[#0B1F14]">Great!</h2>
                <p className="text-[#8D959D]">
                  Your submission has been sent.
                </p>
                <p className="text-[#8D959D]">
                  Please check your email for more details.
                </p>
                <p className="text-[#8D959D]">
                  We'll see you soon!
                </p>
              </div>

              <Button
                onClick={() => {
                  setSubmitted(false)
                  setDataPrivacyAgreed(false)
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
                }}
                variant="outline"
                className="mt-4 h-11 rounded-full border-[#E8EAEB] text-[#0B1F14] hover:bg-[#F7FBF8]"
              >
                Register Another Attendee
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7FBF8] p-4 sm:p-8">
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 z-50 bg-[#0B1F14]/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl border border-[#E8EAEB] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0B1F14]">Crop Image to 1200x628</CardTitle>
              <CardDescription className="text-[#8D959D]">
                Drag the highlighted area to adjust the crop. The image will be resized to 1200x628 pixels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative inline-block max-w-full">
                <img
                  ref={cropImageRef}
                  src={imageToCrop}
                  alt="Crop preview"
                  className="max-w-full h-auto"
                  draggable={false}
                />
                <div
                  className="absolute border-4 border-[#00D47E] bg-[#00D47E]/20 cursor-move"
                  style={{
                    left: cropImageRef.current ? `${(cropArea.x / cropImageRef.current.naturalWidth) * 100}%` : '0%',
                    top: cropImageRef.current ? `${(cropArea.y / cropImageRef.current.naturalHeight) * 100}%` : '0%',
                    width: cropImageRef.current ? `${(cropArea.width / cropImageRef.current.naturalWidth) * 100}%` : '0%',
                    height: cropImageRef.current ? `${(cropArea.height / cropImageRef.current.naturalHeight) * 100}%` : '0%',
                  }}
                  onMouseDown={handleCropMouseDown}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm bg-black/30 pointer-events-none">
                    Drag to reposition
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCropCancel}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="rounded-full bg-[#00D47E] font-semibold text-[#0B1F14] hover:bg-[#00c174]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Crop className="mr-2 h-4 w-4" />
                      Crop & Upload
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && (
        <div className="mb-4 flex w-full max-w-2xl items-center justify-between rounded-2xl border border-[#00D47E]/40 bg-[#00D47E]/15 px-4 py-2 text-[#0B1F14]">
          <span className="flex gap-2 font-semibold"><UserCog /> Admin Mode</span>
        </div>
      )}

      <Card className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E8EAEB] bg-white shadow-sm">
        {(event.feature_image || (isAdmin && editMode)) && (
          <div className="relative">
            {event.feature_image ? (
              <div className="relative aspect-[1200/628] w-full overflow-hidden bg-[#F7FBF8]">
                <img
                  src={event.feature_image}
                  alt={event.name}
                  className="h-full w-full object-contain sm:object-cover"
                />
                {isAdmin && editMode && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Change
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              isAdmin && editMode && (
                <div
                  className="flex aspect-[1200/628] w-full cursor-pointer flex-col items-center justify-center border-b border-dashed border-[#CDEEDD] bg-[#F7FBF8] transition-colors hover:border-[#00D47E]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload feature image</p>
                      <p className="text-xs text-gray-400 mt-1">1200x628 pixels</p>
                    </>
                  )}
                </div>
              )
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        )}

        <div className="relative overflow-hidden bg-[#0B1F14] px-6 py-6 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-32 rounded-full bg-[#00D47E]/25" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-24 w-40 rounded-full bg-[#017C7C]/40" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Event registration</p>
              <CardTitle className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{event.name}</CardTitle>
              {event.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">
                  {event.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <p>
                  {new Date(event.start_date).toLocaleDateString()} –{" "}
                  {new Date(event.end_date).toLocaleDateString()}
                </p>
                <p className="font-semibold text-[#00D47E]">₱{Number(event.price).toLocaleString()}</p>
                <p>{event.venue}</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditMode(!editMode)}
                className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              >
                <Edit2 className="mr-1 h-4 w-4" />
                {editMode ? "Done" : "Edit"}
              </Button>
            )}
          </div>
        </div>

        <CardContent className="space-y-6 px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0B1F14]">Personal Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personal_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="personal_name"
                    required
                    placeholder="Juan"
                    value={formData.personal_name}
                    onChange={(e) => setFormData({ ...formData, personal_name: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    placeholder="Dela"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    required
                    placeholder="Cruz"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="juan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile_number">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mobile_number"
                    type="tel"
                    required
                    placeholder="09123456789"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  required
                  placeholder="123 Main St, Quezon City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0B1F14]">Employment Details (Optional)</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corporation"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    placeholder="Manager"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Company Address</Label>
                <Input
                  id="company_address"
                  placeholder="456 Business Ave, Makati City"
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <Separator />

            <label
              htmlFor="data_privacy"
              className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-[#00D47E] bg-[#F7FBF8] p-4"
            >
              <Checkbox
                id="data_privacy"
                checked={dataPrivacyAgreed}
                onCheckedChange={(checked) => setDataPrivacyAgreed(checked as boolean)}
                disabled={submitting}
                className="mt-0.5 size-6 border-2 border-[#0B1F14] bg-white data-[state=checked]:border-[#00D47E] data-[state=checked]:bg-[#00D47E] data-[state=checked]:text-[#0B1F14]"
              />
              <span className="text-sm font-medium leading-6 text-[#1E1E1E]">
                I agree to the data privacy policy and consent to the collection and processing of my personal information for event registration purposes.{" "}
                <span className="font-semibold text-red-600">*</span>
              </span>
            </label>

            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-[#00D47E] text-base font-semibold text-[#0B1F14] hover:bg-[#00c174]"
              size="lg"
              disabled={submitting || !dataPrivacyAgreed}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}