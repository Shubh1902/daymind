export const dynamic = "force-dynamic"

import Link from "next/link"
import PlayerStats from "@/components/football/PlayerStats"

async function fetchStats() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  // Fetch stats server-side using the API
  const { prisma } = await import("@/lib/prisma")

  const players = await prisma.footballPlayer.findMany({
    where: { active: true },
    include: {
      goals: true,
      gameSelections: { include: { game: true } },
    },
    orderBy: { name: "asc" },
  })

  return players.map((p) => {
    const gamesPlayed = p.gameSelections.filter((gs) => gs.role !== "sub").length
    const gamesSub = p.gameSelections.filter((gs) => gs.role === "sub").length
    const totalGoals = p.goals.length

    let wins = 0, losses = 0, draws = 0
    for (const gs of p.gameSelections) {
      const game = gs.game
      if (game.scoreA == null || game.scoreB == null || !game.completed) continue
      const myScore = gs.team === "A" ? game.scoreA : game.scoreB
      const oppScore = gs.team === "A" ? game.scoreB : game.scoreA
      if (myScore > oppScore) wins++
      else if (myScore < oppScore) losses++
      else draws++
    }

    return {
      id: p.id, name: p.name, position: p.position,
      positions: p.positions, skill: p.skill,
      gamesPlayed, gamesSub, totalGoals,
      wins, losses, draws,
      winRate: (wins + losses + draws) > 0 ? Math.round(wins / (wins + losses + draws) * 100) : 0,
      goalsPerGame: gamesPlayed > 0 ? Math.round(totalGoals / gamesPlayed * 100) / 100 : 0,
    }
  }).sort((a, b) => b.totalGoals - a.totalGoals || b.gamesPlayed - a.gamesPlayed)
}

export default async function FootballStatsPage() {
  const stats = await fetchStats()

  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5 animate-slide-up">
        <Link href="/football" className="p-2 rounded-lg" style={{ background: "#f3f4f6", color: "#374151" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gradient">Player Stats</h1>
          <p className="text-xs" style={{ color: "#9ca3af" }}>{stats.length} players tracked</p>
        </div>
      </div>

      <div className="animate-slide-up delay-100">
        <PlayerStats stats={stats} />
      </div>
    </div>
  )
}
