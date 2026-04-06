export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import GameHistoryList from "@/components/football/GameHistoryList"

export default async function FootballHistoryPage() {
  const games = await prisma.footballGame.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { goals: { include: { player: true, assistPlayer: true } } },
  })

  const serialized = games.map((g) => ({
    id: g.id,
    name: g.name,
    teamAPlayers: g.teamAPlayers as any[],
    teamBPlayers: g.teamBPlayers as any[],
    jerseyA: g.jerseyA,
    jerseyB: g.jerseyB,
    scoreA: g.scoreA,
    scoreB: g.scoreB,
    completed: g.completed,
    balanceScore: g.balanceScore,
    createdAt: g.createdAt.toISOString(),
    goals: g.goals.map((gl) => ({
      id: gl.id, team: gl.team, player: { name: gl.player.name }, assistPlayer: gl.assistPlayer ? { name: gl.assistPlayer.name } : null,
    })),
  }))

  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5 animate-slide-up">
        <Link href="/football" className="p-2 rounded-lg" style={{ background: "#f3f4f6", color: "#374151" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gradient">Game History</h1>
          <p className="text-xs" style={{ color: "#9ca3af" }}>{games.length} past games</p>
        </div>
      </div>

      <div className="animate-slide-up delay-100">
        <GameHistoryList games={serialized} />
      </div>
    </div>
  )
}
