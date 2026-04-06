import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const game = await prisma.footballGame.findUnique({
    where: { id },
    include: {
      selections: { include: { player: true } },
      goals: { include: { player: true, assistPlayer: true }, orderBy: { id: "asc" } },
    },
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

  const game = await prisma.footballGame.findUnique({ where: { id } })
  if (!game) return Response.json({ error: "Not found" }, { status: 404 })

  // Build update data — only include provided fields
  const data: Record<string, unknown> = {}

  // Score
  if (body.scoreA !== undefined) data.scoreA = body.scoreA === null ? null : Number(body.scoreA)
  if (body.scoreB !== undefined) data.scoreB = body.scoreB === null ? null : Number(body.scoreB)

  // If both scores are null, mark as not completed
  if (body.scoreA === null && body.scoreB === null) {
    data.completed = false
  } else if (body.scoreA !== undefined || body.scoreB !== undefined) {
    // If any score provided, mark completed
    const newScoreA = body.scoreA !== undefined ? body.scoreA : game.scoreA
    const newScoreB = body.scoreB !== undefined ? body.scoreB : game.scoreB
    if (newScoreA !== null && newScoreB !== null) data.completed = true
  }

  // Jersey colors
  if (body.jerseyA !== undefined) data.jerseyA = body.jerseyA
  if (body.jerseyB !== undefined) data.jerseyB = body.jerseyB

  // Game name
  if (body.name !== undefined) data.name = body.name

  // Team player snapshots
  if (body.teamAPlayers !== undefined) data.teamAPlayers = body.teamAPlayers
  if (body.teamBPlayers !== undefined) data.teamBPlayers = body.teamBPlayers

  await prisma.footballGame.update({ where: { id }, data })

  // Goals — replace all if provided
  // Each goal: { playerId?: string, team: string, assistPlayerId?: string, minute?: number }
  // playerId can be null/undefined for anonymous goals (score known, scorer unknown)
  if (Array.isArray(body.goals)) {
    await prisma.footballGoal.deleteMany({ where: { gameId: id } })

    const validGoals = body.goals.filter((g: any) => g.team && g.playerId)
    if (validGoals.length > 0) {
      await prisma.footballGoal.createMany({
        data: validGoals.map((g: any) => ({
          gameId: id,
          playerId: g.playerId,
          assistPlayerId: g.assistPlayerId ?? null,
          team: g.team,
          minute: g.minute ?? null,
        })),
      })
    }
  }

  const updated = await prisma.footballGame.findUnique({
    where: { id },
    include: {
      goals: { include: { player: true, assistPlayer: true }, orderBy: { id: "asc" } },
    },
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
