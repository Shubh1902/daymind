import { prisma } from "@/lib/prisma"

export async function GET() {
  const players = await prisma.footballPlayer.findMany({
    where: { active: true },
    include: {
      goals: true,
      gameSelections: {
        include: { game: true },
      },
    },
    orderBy: { name: "asc" },
  })

  const stats = players.map((p) => {
    const gamesPlayed = p.gameSelections.filter((gs) => gs.role !== "sub").length
    const gamesSub = p.gameSelections.filter((gs) => gs.role === "sub").length
    const totalGoals = p.goals.length

    // Win/loss/draw record
    let wins = 0, losses = 0, draws = 0
    for (const gs of p.gameSelections) {
      const game = gs.game
      if (game.scoreA == null || game.scoreB == null || !game.completed) continue
      const myTeam = gs.team
      const myScore = myTeam === "A" ? game.scoreA : game.scoreB
      const oppScore = myTeam === "A" ? game.scoreB : game.scoreA
      if (myScore > oppScore) wins++
      else if (myScore < oppScore) losses++
      else draws++
    }

    return {
      id: p.id,
      name: p.name,
      position: p.position,
      positions: p.positions,
      skill: p.skill,
      gamesPlayed,
      gamesSub,
      totalGoals,
      wins,
      losses,
      draws,
      winRate: gamesPlayed + gamesSub > 0
        ? Math.round(wins / (wins + losses + draws || 1) * 100)
        : 0,
      goalsPerGame: gamesPlayed > 0
        ? Math.round(totalGoals / gamesPlayed * 100) / 100
        : 0,
    }
  })

  // Sort by total goals desc
  stats.sort((a, b) => b.totalGoals - a.totalGoals || b.gamesPlayed - a.gamesPlayed)

  return Response.json(stats)
}
