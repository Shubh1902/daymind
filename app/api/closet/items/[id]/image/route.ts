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

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      // Cache for 1 hour in browser, 1 day on CDN — images rarely change
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
