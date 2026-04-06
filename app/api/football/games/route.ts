import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const games = await prisma.footballGame.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return Response.json(games)
}

/** Save a manually created game */
export async function POST(request: NextRequest) {
  const { teamA, teamB, balanceScore, name } = await request.json()

  if (!Array.isArray(teamA) || !Array.isArray(teamB) || teamA.length < 1 || teamB.length < 1) {
    return Response.json({ error: "Both teams need at least 1 player" }, { status: 400 })
  }

  // Deduplicate: a player can only be on one team. If same ID in both, keep the first occurrence.
  const seenIds = new Set<string>()
  const selectionsA: { playerId: string; team: string; role: string }[] = []
  const selectionsB: { playerId: string; team: string; role: string }[] = []

  for (const p of teamA) {
    if (!seenIds.has(p.playerId)) {
      seenIds.add(p.playerId)
      selectionsA.push({ playerId: p.playerId, team: "A", role: p.role ?? "outfield" })
    }
  }
  for (const p of teamB) {
    if (!seenIds.has(p.playerId)) {
      seenIds.add(p.playerId)
      selectionsB.push({ playerId: p.playerId, team: "B", role: p.role ?? "outfield" })
    }
  }

  const game = await prisma.footballGame.create({
    data: {
      name: name || "Manual Game",
      teamAPlayers: teamA,
      teamBPlayers: teamB,
      balanceScore: balanceScore ?? null,
      selections: {
        create: [...selectionsA, ...selectionsB],
      },
    },
  })

  return Response.json({ id: game.id }, { status: 201 })
}
