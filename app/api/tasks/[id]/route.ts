import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.task.findFirst({ where: { id, userId: USER_ID } })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (body.text !== undefined) data.text = body.text
  if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null
  if (body.estimatedMinutes !== undefined) data.estimatedMinutes = body.estimatedMinutes ? Number(body.estimatedMinutes) : null
  if (body.priority !== undefined) data.priority = body.priority
  if (body.category !== undefined) data.category = body.category
  if (body.notes !== undefined) data.notes = body.notes
  if (body.deferCount !== undefined) data.deferCount = Number(body.deferCount)
  if (body.completed !== undefined) {
    data.completed = body.completed
    data.completedAt = body.completed ? new Date() : null
  }

  const task = await prisma.task.update({ where: { id }, data })
  return Response.json(task)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.task.findFirst({ where: { id, userId: USER_ID } })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.task.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
