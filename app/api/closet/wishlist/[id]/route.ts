import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.wishlistItem.findFirst({
    where: { id, userId: USER_ID },
  })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.category !== undefined) data.category = body.category
  if (body.color !== undefined) data.color = body.color
  if (body.description !== undefined) data.description = body.description
  if (body.priority !== undefined) data.priority = body.priority
  if (body.purchased !== undefined) data.purchased = body.purchased

  const item = await prisma.wishlistItem.update({ where: { id }, data })
  return Response.json(item)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const existing = await prisma.wishlistItem.findFirst({
    where: { id, userId: USER_ID },
  })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.wishlistItem.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
