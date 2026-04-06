import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const game = await prisma.footballGame.findUnique({
    where: { id },
    include: { selections: { include: { player: true } }, goals: { include: { player: true } } },
  })
  if (!game) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(game)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { scoreA, scoreB, goals } = body

  const game = await prisma.footballGame.findUnique({ where: { id } })
  if (!game) return Response.json({ error: "Not found" }, { status: 404 })

  // Update score — if scores provided, mark completed; if both null, undo result
  const data: Record<string, unknown> = {}
  if (scoreA === null && scoreB === null) {
    // Undo: clear result
    data.scoreA = null
    data.scoreB = null
    data.completed = false
  } else {
    data.completed = true
    if (scoreA !== undefined) data.scoreA = Number(scoreA)
    if (scoreB !== undefined) data.scoreB = Number(scoreB)
  }

  await prisma.footballGame.update({ where: { id }, data })

  // Save goals — delete existing first then recreate
  if (Array.isArray(goals)) {
    await prisma.footballGoal.deleteMany({ where: { gameId: id } })
    if (goals.length > 0) {
      await prisma.footballGoal.createMany({
        data: goals.map((g: { playerId: string; team: string; minute?: number }) => ({
          gameId: id,
          playerId: g.playerId,
          team: g.team,
          minute: g.minute ?? null,
        })),
      })
    }
  }

  const updated = await prisma.footballGame.findUnique({
    where: { id },
    include: { goals: { include: { player: true } } },
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.footballGame.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
