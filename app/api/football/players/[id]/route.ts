import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.footballPlayer.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.position !== undefined) data.position = body.position
  if (body.skill !== undefined) data.skill = Number(body.skill)
  if (body.workRate !== undefined) data.workRate = body.workRate
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null
  if (body.active !== undefined) data.active = body.active

  const updated = await prisma.footballPlayer.update({ where: { id }, data })
  return Response.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const existing = await prisma.footballPlayer.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  // Soft delete
  await prisma.footballPlayer.update({ where: { id }, data: { active: false } })
  return new Response(null, { status: 204 })
}
