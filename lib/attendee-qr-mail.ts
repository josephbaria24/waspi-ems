import QRCode from "qrcode"
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"

const QR_CID = "attendee-qr"

function safeFileName(name: string) {
  const base = name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "attendee"
  return base.slice(0, 60)
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

async function buildQrPdf(png: Buffer, info: { name: string; eventName?: string; referenceId?: string }) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([420, 595])
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const image = await pdf.embedPng(png)
  const { width, height } = page.getSize()
  const margin = 36

  const eventLines = wrapText(info.eventName || "WASPI event", regular, 11, width - margin * 2)
  let y = height - 48
  for (const line of eventLines.slice(0, 3)) {
    page.drawText(line, { x: margin, y, size: 11, font: regular, color: rgb(0.004, 0.486, 0.486) })
    y -= 16
  }

  y -= 6
  const nameLines = wrapText(info.name || "Attendee", bold, 18, width - margin * 2)
  for (const line of nameLines.slice(0, 3)) {
    page.drawText(line, { x: margin, y, size: 18, font: bold, color: rgb(0.043, 0.122, 0.078) })
    y -= 24
  }

  const qrSize = 250
  page.drawImage(image, {
    x: (width - qrSize) / 2,
    y: 150,
    width: qrSize,
    height: qrSize,
  })

  page.drawText("This QR code is issued to this attendee only.", {
    x: margin,
    y: 118,
    size: 11,
    font: regular,
    color: rgb(0.12, 0.12, 0.12),
  })

  const referenceLines = wrapText(
    info.referenceId ? `Reference: ${info.referenceId}` : "",
    regular,
    9,
    width - margin * 2,
  )
  let refY = 98
  for (const line of referenceLines.slice(0, 3)) {
    if (!line) continue
    page.drawText(line, { x: margin, y: refY, size: 9, font: regular, color: rgb(0.45, 0.45, 0.45) })
    refY -= 12
  }

  return Buffer.from(await pdf.save())
}

export async function buildAttendeeQrMail(info: {
  value: string
  name: string
  eventName?: string
  referenceId?: string
}) {
  const png = await QRCode.toBuffer(info.value, {
    type: "png",
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
  })
  const pdf = await buildQrPdf(png, info)
  const fileBase = safeFileName(info.name)

  return {
    cid: QR_CID,
    attachments: [
      {
        filename: "qr-code.png",
        content: png,
        cid: QR_CID,
        contentType: "image/png",
        contentDisposition: "inline" as const,
      },
      {
        filename: `${fileBase}-QR.png`,
        content: png,
        contentType: "image/png",
        contentDisposition: "attachment" as const,
      },
      {
        filename: `${fileBase}-QR.pdf`,
        content: pdf,
        contentType: "application/pdf",
        contentDisposition: "attachment" as const,
      },
    ],
  }
}
