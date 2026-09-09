"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Pencil, X } from "lucide-react"

const OUTPUT_WIDTH = 1200
const OUTPUT_HEIGHT = 628
const RATIO = OUTPUT_WIDTH / OUTPUT_HEIGHT

type Crop = { x: number; y: number; width: number; height: number }

function initialCrop(width: number, height: number): Crop {
  const imageRatio = width / height
  if (imageRatio > RATIO) {
    const cropHeight = height
    const cropWidth = cropHeight * RATIO
    return { x: (width - cropWidth) / 2, y: 0, width: cropWidth, height: cropHeight }
  }
  const cropWidth = width
  const cropHeight = cropWidth / RATIO
  return { x: 0, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight }
}

function clampCrop(crop: Crop, imageWidth: number, imageHeight: number): Crop {
  const width = Math.max(80, Math.min(crop.width, imageWidth))
  const height = width / RATIO
  const fittedHeight = Math.min(height, imageHeight)
  const fittedWidth = fittedHeight * RATIO
  const x = Math.max(0, Math.min(crop.x, imageWidth - fittedWidth))
  const y = Math.max(0, Math.min(crop.y, imageHeight - fittedHeight))
  return { x, y, width: fittedWidth, height: fittedHeight }
}

async function exportCover(src: string, crop: Crop) {
  const img = new Image()
  img.src = src
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const canvas = document.createElement("canvas")
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not crop image")

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)
  return canvas.toDataURL("image/jpeg", 0.92)
}

export function EventCoverCrop({
  value,
  onChange,
}: {
  value: string
  onChange: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const sourceRef = useRef<string>("")
  const [source, setSource] = useState("")
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT })
  const [editing, setEditing] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    return () => {
      if (sourceRef.current.startsWith("blob:")) URL.revokeObjectURL(sourceRef.current)
    }
  }, [])

  const openFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    if (sourceRef.current.startsWith("blob:")) URL.revokeObjectURL(sourceRef.current)
    const url = URL.createObjectURL(file)
    sourceRef.current = url
    const img = new Image()
    img.onload = () => {
      setSource(url)
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      setCrop(initialCrop(img.naturalWidth, img.naturalHeight))
      setEditing(true)
    }
    img.src = url
  }

  const startDrag = (mode: "move" | "resize", event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const img = imageRef.current
    if (!img) return

    const startX = event.clientX
    const startY = event.clientY
    const startCrop = crop
    const scaleX = img.naturalWidth / img.getBoundingClientRect().width
    const scaleY = img.naturalHeight / img.getBoundingClientRect().height

    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) * scaleX
      const dy = (moveEvent.clientY - startY) * scaleY
      if (mode === "move") {
        setCrop(clampCrop({ ...startCrop, x: startCrop.x + dx, y: startCrop.y + dy }, img.naturalWidth, img.naturalHeight))
        return
      }
      setCrop(
        clampCrop(
          { ...startCrop, width: startCrop.width + dx, height: (startCrop.width + dx) / RATIO },
          img.naturalWidth,
          img.naturalHeight,
        ),
      )
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const applyCrop = async () => {
    const dataUrl = await exportCover(source, crop)
    onChange(dataUrl)
    setEditing(false)
  }

  const clearCover = () => {
    onChange("")
    setEditing(false)
    setSource("")
    if (sourceRef.current.startsWith("blob:")) URL.revokeObjectURL(sourceRef.current)
    sourceRef.current = ""
  }

  const boxStyle = imageSize.width
    ? {
        left: `${(crop.x / imageSize.width) * 100}%`,
        top: `${(crop.y / imageSize.height) * 100}%`,
        width: `${(crop.width / imageSize.width) * 100}%`,
        height: `${(crop.height / imageSize.height) * 100}%`,
      }
    : undefined

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) openFile(file)
          event.target.value = ""
        }}
      />

      {!editing && !value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#CDEEDD] bg-[#F7FBF8] px-4 py-8 text-sm text-[#8D959D] transition hover:border-[#00D47E]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#017C7C]">
            <ImagePlus className="h-5 w-5" />
          </span>
          Add cover image
          <span className="text-xs">Crop and resize to 1200 × 628</span>
        </button>
      )}

      {editing && source && (
        <div className="space-y-3 rounded-2xl border border-[#E8EAEB] bg-[#F7FBF8] p-3">
          <p className="text-xs text-[#8D959D]">Drag the frame to move it. Drag the corner to resize. It saves at 1200 × 628.</p>
          <div className="flex justify-center overflow-hidden rounded-xl bg-[#0B1F14]">
            <div className="relative w-fit">
            <img
              ref={imageRef}
              src={source}
              alt=""
              className="max-h-72 max-w-full"
              onLoad={(event) =>
                setImageSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
            />
            <div
              className="absolute cursor-move border-2 border-[#00D47E] bg-black/20"
              style={boxStyle}
              onPointerDown={(event) => startDrag("move", event)}
            >
              <span
                className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-[#00D47E]"
                onPointerDown={(event) => startDrag("resize", event)}
              />
            </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-10 flex-1 rounded-full border border-[#E8EAEB] bg-white text-sm font-semibold text-[#1E1E1E]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCrop}
              className="h-10 flex-1 rounded-full bg-[#00D47E] text-sm font-semibold text-[#0B1F14]"
            >
              Use this crop
            </button>
          </div>
        </div>
      )}

      {!editing && value && (
        <div className="overflow-hidden rounded-2xl border border-[#E8EAEB] bg-white">
          <img src={value} alt="Event cover" className="aspect-[1200/628] w-full object-cover" />
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="text-xs text-[#8D959D]">1200 × 628 cover</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  if (source) setEditing(true)
                  else inputRef.current?.click()
                }}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#0B1F14] hover:bg-[#F7FBF8]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={clearCover}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
