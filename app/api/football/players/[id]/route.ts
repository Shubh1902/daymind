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
  if (body.positions !== undefined) data.positions = Array.isArray(body.positions) ? body.positions : []
  if (body.skill !== undefined) data.skill = Number(body.skill)
  if (body.workRate !== undefined) data.workRate = body.workRate
  if (body.pace !== undefined) data.pace = Math.max(1, Math.min(99, Number(body.pace)))
  if (body.shooting !== undefined) data.shooting = Math.max(1, Math.min(99, Number(body.shooting)))
  if (body.passing !== undefined) data.passing = Math.max(1, Math.min(99, Number(body.passing)))
  if (body.dribbling !== undefined) data.dribbling = Math.max(1, Math.min(99, Number(body.dribbling)))
  if (body.defending !== undefined) data.defending = Math.max(1, Math.min(99, Number(body.defending)))
  if (body.physical !== undefined) data.physical = Math.max(1, Math.min(99, Number(body.physical)))
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null
  if (body.aliases !== undefined) data.aliases = Array.isArray(body.aliases) ? body.aliases : []
  if (body.active !== undefined) data.active = body.active
  if (body.waitlisted !== undefined) data.waitlisted = body.waitlisted
  if (body.waitlistPriority !== undefined) data.waitlistPriority = Number(body.waitlistPriority)

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
