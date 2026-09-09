'use client'

import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { Upload, CheckCircle2, FileImage, X, Loader2 } from 'lucide-react'

export default function UploadReceiptPage() {
  const searchParams = useSearchParams()
  const trackingFromUrl = searchParams.get('tracking') || ''

  const [trackingNumber, setTrackingNumber] = useState(trackingFromUrl)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const nextFiles: File[] = []
    const nextPreviews: string[] = []

    for (const item of selected) {
      if (!allowedTypes.includes(item.type)) {
        setError('Please upload JPG, PNG, WebP, or PDF files.')
        continue
      }
      if (item.size > 10 * 1024 * 1024) {
        setError('Each file must be less than 10MB.')
        continue
      }
      nextFiles.push(item)
      if (item.type.startsWith('image/')) {
        nextPreviews.push(URL.createObjectURL(item))
      } else {
        nextPreviews.push('')
      }
    }

    if (nextFiles.length) {
      setFiles((prev) => [...prev, ...nextFiles])
      setPreviews((prev) => [...prev, ...nextPreviews])
      setError('')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter your tracking number.')
      return
    }
    if (files.length === 0) {
      setError('Please select at least one receipt.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach((item) => formData.append('file', item))
      formData.append('trackingNumber', trackingNumber.trim())

      const res = await fetch('/api/membership/upload-receipt', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed. Please try again.')
        return
      }

      setUploadedCount(data.receipts?.length || files.length)
      setUploadSuccess(true)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (uploadSuccess) {
    return (
      <>
        <Header title="Upload Receipt" />
        <div className="min-h-screen bg-background px-4 py-12">
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="py-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle2 className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    Receipt Uploaded!
                  </h2>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {uploadedCount} receipt{uploadedCount === 1 ? '' : 's'} submitted for tracking number <strong className="text-primary font-mono">{trackingNumber}</strong>.
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-sm mx-auto text-left space-y-2">
                  <p className="text-sm font-semibold text-foreground">What happens next?</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>An admin will review your receipt</li>
                    <li>Your membership will be activated upon approval</li>
                    <li>You&apos;ll receive a confirmation email</li>
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  Review usually takes 24-48 business hours.
                </p>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Upload Receipt" />
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-lg mx-auto space-y-6">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Payment Receipt
              </CardTitle>
              <CardDescription>
                Submit one or more payment receipts for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Tracking Number Input */}
              <div className="space-y-2">
                <Label htmlFor="trackingNumber" className="text-foreground font-medium">
                  Tracking Number *
                </Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="WASPI-XXXXXXXXX"
                  className="font-mono border-input focus:border-primary focus:ring-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the tracking number you received after registration
                </p>
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">
                  Payment receipts *
                </Label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <FileImage className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Click to add one or more receipts
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP or PDF — Max 10MB each
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-3">
                    {files.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="border border-primary/20 rounded-lg p-3 space-y-2">
                        {previews[index] && (
                          <img
                            src={previews[index]}
                            alt={`Receipt ${index + 1}`}
                            className="w-full max-h-40 object-contain rounded-md bg-muted"
                          />
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileImage className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm text-foreground truncate">{item.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            aria-label="Remove receipt"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Payment Info Reminder */}
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Payment Accounts:</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground font-medium uppercase">GCash</p>
                    <p className="font-mono text-foreground font-semibold">0912 345 6789</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Maya</p>
                    <p className="font-mono text-foreground font-semibold">0912 345 6789</p>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Bank Transfer</p>
                  <p className="text-sm"><span className="text-muted-foreground">Bank / Branch:</span> <span className="font-semibold">Landbank of the Philippines / Davao City</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Savings Account Name:</span> <span className="font-semibold">Workplace Advocates on Safety in the Philippines, Inc.</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Bank Account Number:</span> <span className="font-mono font-semibold">5911-0175-73</span></p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0 || !trackingNumber.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit {files.length > 1 ? `${files.length} receipts` : 'Receipt'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
