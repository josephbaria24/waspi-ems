const BANNER_CID = "event-banner"

export async function buildEventBannerMail(imageUrl?: string | null) {
  const url = String(imageUrl || "").trim()
  if (!url.startsWith("http")) return null

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const contentType = (response.headers.get("content-type") || "image/jpeg").split(";")[0]
    const content = Buffer.from(await response.arrayBuffer())
    if (!content.length) return null
    const extension = contentType.includes("png") ? "png" : "jpg"

    return {
      cid: BANNER_CID,
      src: `cid:${BANNER_CID}`,
      attachments: [
        {
          filename: `event-banner.${extension}`,
          content,
          cid: BANNER_CID,
          contentType,
          contentDisposition: "inline" as const,
        },
      ],
    }
  } catch (error) {
    console.error("Event banner fetch failed:", error)
    return {
      cid: "",
      src: url,
      attachments: [],
    }
  }
}
