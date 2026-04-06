export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import FootballApp from "@/components/football/FootballApp"
import FootballDashboard from "@/components/football/FootballDashboard"
import Link from "next/link"

export default async function FootballPage() {
  const players = await prisma.footballPlayer.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { skill: "desc" }, { name: "asc" }],
  })

  const serialized = players.map((p) => ({
    id: p.id, name: p.name, position: p.position, positions: p.positions,
    pace: p.pace, shooting: p.shooting, passing: p.passing,
    dribbling: p.dribbling, defending: p.defending, physical: p.physical,
    skill: p.skill, workRate: p.workRate, notes: p.notes,
    aliases: p.aliases, waitlisted: p.waitlisted,
  }))

  // Fetch recent games for dashboard
  const recentGames = await prisma.footballGame.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { goals: { include: { player: true, assistPlayer: true } } },
  })

  const gamesSerialized = recentGames.map((g) => ({
    id: g.id, name: g.name,
    teamAPlayers: g.teamAPlayers as any[],
    teamBPlayers: g.teamBPlayers as any[],
    jerseyA: g.jerseyA, jerseyB: g.jerseyB,
    scoreA: g.scoreA, scoreB: g.scoreB,
    completed: g.completed, balanceScore: g.balanceScore,
    createdAt: g.createdAt.toISOString(),
    goals: g.goals.map((gl) => ({
      id: gl.id, team: gl.team,
      player: { name: gl.player.name },
      assistPlayer: gl.assistPlayer ? { name: gl.assistPlayer.name } : null,
    })),
  }))

  // Quick stats
  const totalGames = await prisma.footballGame.count({ where: { completed: true } })
  const totalGoals = await prisma.footballGoal.count()

  return (
    <div className="animate-fade-in pb-24 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Football</h1>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
            {players.length} players · {totalGames} games · {totalGoals} goals
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/football/stats" className="text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
            📊 Stats
          </Link>
          <Link href="/football/history" className="text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}>
            📋 History
          </Link>
        </div>
      </div>

      {/* Dashboard — most recent game + quick stats */}
      <div className="mb-5 animate-slide-up delay-50">
        <FootballDashboard games={gamesSerialized} totalGames={totalGames} totalGoals={totalGoals} />
      </div>

      <div className="animate-slide-up delay-100">
        <FootballApp initialPlayers={serialized} />
      </div>
    </div>
  )
}
