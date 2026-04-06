type TeamAssignment = {
  playerId: string; name: string; position: string; skill: number; workRate: string; role: string
}

const WR: Record<string, number> = { Low: 0.85, Med: 1.0, High: 1.15 }

function score(team: TeamAssignment[]): number {
  return team.reduce((s, p) => s + p.skill * (WR[p.workRate] ?? 1), 0)
}

export type Difference = {
  playerId: string; name: string; manualTeam: "A" | "B"; autoTeam: "A" | "B"
}

export type SwapSuggestion = {
  playerA: { id: string; name: string }
  playerB: { id: string; name: string }
  currentBalance: number
  newBalance: number
  improvement: number
}

export type ComparisonResult = {
  differences: Difference[]
  suggestedSwaps: SwapSuggestion[]
}

/** Compare manual teams against auto-generated teams and suggest swaps */
export function compareTeams(
  manualA: TeamAssignment[],
  manualB: TeamAssignment[],
  autoA: TeamAssignment[],
  autoB: TeamAssignment[]
): ComparisonResult {
  // Find differences
  const autoTeamMap = new Map<string, "A" | "B">()
  for (const p of autoA) autoTeamMap.set(p.playerId, "A")
  for (const p of autoB) autoTeamMap.set(p.playerId, "B")

  const differences: Difference[] = []
  for (const p of manualA) {
    const autoTeam = autoTeamMap.get(p.playerId)
    if (autoTeam && autoTeam !== "A") {
      differences.push({ playerId: p.playerId, name: p.name, manualTeam: "A", autoTeam })
    }
  }
  for (const p of manualB) {
    const autoTeam = autoTeamMap.get(p.playerId)
    if (autoTeam && autoTeam !== "B") {
      differences.push({ playerId: p.playerId, name: p.name, manualTeam: "B", autoTeam })
    }
  }

  // Suggest swaps to improve manual team balance
  const currentScoreA = score(manualA)
  const currentScoreB = score(manualB)
  const maxCurrent = Math.max(currentScoreA, currentScoreB, 1)
  const currentBalance = Math.round((100 - Math.abs(currentScoreA - currentScoreB) / maxCurrent * 100) * 10) / 10

  const swaps: SwapSuggestion[] = []

  for (const pA of manualA) {
    if (pA.role === "gk") continue
    for (const pB of manualB) {
      if (pB.role === "gk") continue

      // Simulate swap
      const pAScore = pA.skill * (WR[pA.workRate] ?? 1)
      const pBScore = pB.skill * (WR[pB.workRate] ?? 1)
      const newScoreA = currentScoreA - pAScore + pBScore
      const newScoreB = currentScoreB - pBScore + pAScore
      const maxNew = Math.max(newScoreA, newScoreB, 1)
      const newBalance = Math.round((100 - Math.abs(newScoreA - newScoreB) / maxNew * 100) * 10) / 10
      const improvement = newBalance - currentBalance

      if (improvement > 0.5) {
        swaps.push({
          playerA: { id: pA.playerId, name: pA.name },
          playerB: { id: pB.playerId, name: pB.name },
          currentBalance,
          newBalance,
          improvement: Math.round(improvement * 10) / 10,
        })
      }
    }
  }

  // Sort by improvement desc, take top 5
  swaps.sort((a, b) => b.improvement - a.improvement)
  return { differences, suggestedSwaps: swaps.slice(0, 5) }
}
