import { prisma } from "@/lib/prisma"
import FootballApp from "@/components/football/FootballApp"
import FootballDashboard from "@/components/football/FootballDashboard"

export default async function FootballContent() {
  const [players, recentGames, totalGames, totalGoals] = await Promise.all([
    prisma.footballPlayer.findMany({
      where: { active: true },
      orderBy: [{ position: "asc" }, { skill: "desc" }, { name: "asc" }],
    }),
    prisma.footballGame.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { goals: { include: { player: true, assistPlayer: true } } },
    }),
    prisma.footballGame.count({ where: { completed: true } }),
    prisma.footballGoal.count(),
  ])

  const serialized = players.map((p) => ({
    id: p.id, name: p.name, position: p.position, positions: p.positions,
    pace: p.pace, shooting: p.shooting, passing: p.passing,
    dribbling: p.dribbling, defending: p.defending, physical: p.physical,
    skill: p.skill, workRate: p.workRate, notes: p.notes,
    aliases: p.aliases, waitlisted: p.waitlisted,
  }))

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

  return (
    <>
      <p className="text-xs mb-5 animate-slide-up" style={{ color: "#9ca3af" }}>
        {players.length} players · {totalGames} games · {totalGoals} goals
      </p>

      <div className="mb-5 animate-slide-up delay-50">
        <FootballDashboard games={gamesSerialized} totalGames={totalGames} totalGoals={totalGoals} />
      </div>

      <div className="animate-slide-up delay-100">
        <FootballApp initialPlayers={serialized} />
      </div>
    </>
  )
}
