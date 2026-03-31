import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.clothingItem.findFirst({
    where: { id, userId: USER_ID },
  })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (body.category !== undefined) data.category = body.category
  if (body.subcategory !== undefined) data.subcategory = body.subcategory
  if (body.color !== undefined) data.color = body.color
  if (body.pattern !== undefined) data.pattern = body.pattern
  if (body.season !== undefined) data.season = body.season
  if (body.name !== undefined) data.name = body.name
  if (body.favorite !== undefined) data.favorite = body.favorite
  if (body.wearCount !== undefined) data.wearCount = Number(body.wearCount)
  if (body.lastWornAt !== undefined) data.lastWornAt = body.lastWornAt ? new Date(body.lastWornAt) : null

  const item = await prisma.clothingItem.update({ where: { id }, data })
  return Response.json(item)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.clothingItem.findFirst({
    where: { id, userId: USER_ID },
  })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.clothingItem.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
