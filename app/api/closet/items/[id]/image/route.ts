import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Serves a clothing item's image as a binary response with aggressive caching.
 * This avoids embedding huge base64 strings in the HTML payload.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const item = await prisma.clothingItem.findUnique({
    where: { id },
    select: { imageData: true },
  })

  if (!item?.imageData) {
    return new Response("Not found", { status: 404 })
  }

  const dataUri = item.imageData
  // Parse data URI: "data:image/png;base64,iVBOR..."
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    // If it's already a URL or raw data, redirect
    return Response.redirect(dataUri, 302)
  }

  const contentType = match[1]
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, "base64")

  const ext = contentType.split("/")[1] ?? "png"
  const isDownload = new URL(_request.url).searchParams.get("download") === "true"

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(buffer.length),
    "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  }

  if (isDownload) {
    // Fetch the item name for the filename
    const itemMeta = await prisma.clothingItem.findUnique({
      where: { id },
      select: { name: true, category: true },
    })
    const filename = (itemMeta?.name ?? itemMeta?.category ?? "clothing-item")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
    headers["Content-Disposition"] = `attachment; filename="${filename}.${ext}"`
  }

  return new Response(buffer, { headers })
}
