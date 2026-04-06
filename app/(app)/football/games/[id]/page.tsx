export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import GameDetail from "@/components/football/GameDetail"

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const game = await prisma.footballGame.findUnique({
    where: { id },
    include: {
      goals: { include: { player: true, assistPlayer: true }, orderBy: { id: "asc" } },
    },
  })

  if (!game) notFound()

  const allPlayers = await prisma.footballPlayer.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  })

  const serialized = {
    id: game.id,
    name: game.name,
    teamAPlayers: game.teamAPlayers as any[],
    teamBPlayers: game.teamBPlayers as any[],
    jerseyA: game.jerseyA,
    jerseyB: game.jerseyB,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    completed: game.completed,
    balanceScore: game.balanceScore,
    createdAt: game.createdAt.toISOString(),
    goals: game.goals.map((g) => ({
      id: g.id,
      team: g.team,
      playerId: g.playerId,
      assistPlayerId: g.assistPlayerId,
      minute: g.minute,
      player: { id: g.player.id, name: g.player.name },
      assistPlayer: g.assistPlayer ? { id: g.assistPlayer.id, name: g.assistPlayer.name } : null,
    })),
  }

  const playersSerialized = allPlayers.map((p) => ({
    id: p.id, name: p.name, position: p.position, skill: p.skill,
  }))

  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <GameDetail game={serialized} allPlayers={playersSerialized} />
    </div>
  )
}
