import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTeams } from "@/lib/football-balancer"
import { parseInstructions } from "@/lib/football-instructions"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { playerIds, instructions, name, jerseyA, jerseyB } = body

  if (!Array.isArray(playerIds) || playerIds.length < 4) {
    return Response.json({ error: "Select at least 4 players" }, { status: 400 })
  }

  // Fetch selected players
  const players = await prisma.footballPlayer.findMany({
    where: { id: { in: playerIds }, active: true },
  })

  if (players.length < 4) {
    return Response.json({ error: "Not enough valid players found" }, { status: 400 })
  }

  // Parse instructions
  const rosterNames = players.map((p) => p.name)
  const constraints = parseInstructions(instructions ?? "", rosterNames)

  // Generate balanced teams
  const { teamA, teamB, balanceScore } = generateTeams(
    players.map((p) => ({
      id: p.id, name: p.name, position: p.position, skill: p.skill, workRate: p.workRate,
      pace: p.pace, shooting: p.shooting, passing: p.passing,
      dribbling: p.dribbling, defending: p.defending, physical: p.physical,
    })),
    constraints
  )

  // Save game
  const game = await prisma.footballGame.create({
    data: {
      name: name || null,
      instructions: instructions || null,
      teamAPlayers: teamA,
      teamBPlayers: teamB,
      balanceScore,
      jerseyA: jerseyA || null,
      jerseyB: jerseyB || null,
      selections: {
        create: [
          ...teamA.map((p) => ({ playerId: p.playerId, team: "A", role: p.role })),
          ...teamB.map((p) => ({ playerId: p.playerId, team: "B", role: p.role })),
        ],
      },
    },
  })

  return Response.json({
    id: game.id,
    teamA,
    teamB,
    balanceScore,
    name: game.name,
  }, { status: 201 })
}
