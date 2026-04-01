import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getChoreDefaults } from "@/lib/household-chores"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.householdTask.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (body.choreType !== undefined) {
    data.choreType = body.choreType
    data.effortScore = getChoreDefaults(body.choreType).effortScore
  }
  if (body.memberId !== undefined) data.memberId = body.memberId
  if (body.durationMinutes !== undefined) data.durationMinutes = Number(body.durationMinutes)
  if (body.description !== undefined) data.description = body.description
  if (body.completedAt !== undefined) data.completedAt = new Date(body.completedAt)

  const task = await prisma.householdTask.update({
    where: { id },
    data,
    include: { member: true },
  })

  return Response.json(task)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.householdTask.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.householdTask.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
