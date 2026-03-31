import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

// GET extra images for an item
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const item = await prisma.clothingItem.findFirst({ where: { id, userId: USER_ID } })
  if (!item) return Response.json({ error: "Not found" }, { status: 404 })

  const images = await prisma.clothingItemImage.findMany({
    where: { clothingItemId: id },
    orderBy: { sortOrder: "asc" },
  })
  return Response.json(images)
}

// POST add extra image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const item = await prisma.clothingItem.findFirst({ where: { id, userId: USER_ID } })
  if (!item) return Response.json({ error: "Not found" }, { status: 404 })

  const { imageData, label } = await request.json()
  if (!imageData) {
    return Response.json({ error: "imageData is required" }, { status: 400 })
  }

  const count = await prisma.clothingItemImage.count({ where: { clothingItemId: id } })
  if (count >= 5) {
    return Response.json({ error: "Maximum 5 extra images per item" }, { status: 400 })
  }

  const image = await prisma.clothingItemImage.create({
    data: {
      clothingItemId: id,
      imageData,
      label: label ?? null,
      sortOrder: count,
    },
  })

  return Response.json(image, { status: 201 })
}

// DELETE extra image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { imageId } = await request.json()
  if (!imageId) return Response.json({ error: "imageId is required" }, { status: 400 })

  await prisma.clothingItemImage.deleteMany({
    where: {
      id: imageId,
      clothingItem: { id, userId: USER_ID },
    },
  })
  return new Response(null, { status: 204 })
}
